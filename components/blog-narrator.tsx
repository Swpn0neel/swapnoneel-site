"use client";

import { Check, ChevronDown, Pause, Play, RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
// Rough speaking pace of Web Speech voices at 1x, used only for the time labels.
const BASE_WPM = 170;

// Chrome/Windows can clip the beginning of speech while its native TTS backend
// is recovering from cancel(). A real, silent utterance is used as a
// sacrificial queue head; its onstart event is the only useful signal the API
// exposes that the new queue has reached the speech engine. Keep this text
// non-empty: empty/whitespace-only utterances have their own Chromium bugs.
const RESTART_PRIMER_TEXT = "ready";
const RESTART_PRIMER_RATE = 2;
const PRIMER_START_TIMEOUT_MS = 1200;

// The primer protects cancel -> speak. This short, unspoken punctuation lead-in
// also gives every later chunk a few generated silence frames, so a voice that
// clips the beginning of each native utterance clips the pause, not the word.
const CHUNK_LEAD_IN = "… ";

interface WordSpan {
  el: HTMLSpanElement;
  text: string;
}

// A chunk is one utterance: a contiguous run of words inside a single block
// element (paragraph, heading, list item). Keeping utterances block-sized
// avoids the Chrome bug where long utterances silently die mid-speech.
interface Chunk {
  start: number; // index into words[]
  end: number; // exclusive
  text: string;
  // Character offset of each word inside `text`, for onboundary mapping.
  offsets: number[];
}

const SKIP_TAGS = new Set([
  "PRE",
  "CODE",
  "TABLE",
  "IMG",
  "FIGURE",
  "FIGCAPTION",
  "SCRIPT",
  "STYLE",
]);

const BLOCK_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "LI",
  "BLOCKQUOTE",
  "TD",
  "DT",
  "DD",
]);

function formatTime(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function BlogNarrator({ articleId }: { articleId: string }) {
  const [supported, setSupported] = useState(true);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rateIdx, setRateIdx] = useState(2); // 1x
  const [wordIdx, setWordIdx] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const waveformClipId = `narration-progress-${useId().replaceAll(":", "")}`;

  // A restrained, deterministic waveform. The blended frequencies produce a
  // natural speech rhythm without the noisy equalizer look of random bars.
  const BAR_COUNT = 64;
  const barHeights = useMemo(() => {
    const heights: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const phrase = 0.46 + 0.2 * Math.sin(i * 0.32 + 0.4);
      const syllable = 0.12 * Math.sin(i * 1.17 + 1.1);
      const breath = 0.08 * Math.cos(i * 0.13);
      heights.push(Math.min(0.88, Math.max(0.2, phrase + syllable + breath)));
    }
    return heights;
  }, []);

  // Close the speed menu on outside click.
  useEffect(() => {
    if (!speedOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!speedMenuRef.current?.contains(e.target as Node)) {
        setSpeedOpen(false);
      }
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [speedOpen]);

  const wordsRef = useRef<WordSpan[]>([]);
  const chunksRef = useRef<Chunk[]>([]);
  const proseRef = useRef<HTMLElement | null>(null);
  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const wordIdxRef = useRef(0);
  const rateRef = useRef(1);
  const lastUserScrollRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  // Incremented on every (re)start; stale utterance callbacks and pending
  // start-polls compare against it and bail, so rapid seeks can't race.
  const genRef = useRef(0);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- one-time setup: wrap every narratable word in an indexed span ----
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    const prose = document.getElementById(articleId);
    if (!prose) return;
    proseRef.current = prose;

    const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        let el = node.parentElement;
        while (el && el !== prose) {
          if (SKIP_TAGS.has(el.tagName) || el.hasAttribute("data-no-narrate"))
            return NodeFilter.FILTER_REJECT;
          el = el.parentElement;
        }
        return /\S/.test(node.nodeValue || "")
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });

    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

    const words: WordSpan[] = [];
    const blockOf: HTMLElement[] = [];
    for (const node of textNodes) {
      let block = node.parentElement;
      while (block && block !== prose && !BLOCK_TAGS.has(block.tagName)) {
        block = block.parentElement;
      }
      const frag = document.createDocumentFragment();
      for (const token of (node.nodeValue || "").split(/(\s+)/)) {
        if (!token) continue;
        if (/^\s+$/.test(token)) {
          frag.appendChild(document.createTextNode(token));
        } else {
          const span = document.createElement("span");
          span.className = "nw";
          span.dataset.nwi = String(words.length);
          span.textContent = token;
          frag.appendChild(span);
          words.push({ el: span, text: token });
          blockOf.push(block || prose);
        }
      }
      node.parentNode?.replaceChild(frag, node);
    }

    // Group consecutive words that share a block element into chunks.
    const chunks: Chunk[] = [];
    let i = 0;
    while (i < words.length) {
      const j0 = i;
      const parts: string[] = [];
      const offsets: number[] = [];
      let len = 0;
      while (i < words.length && blockOf[i] === blockOf[j0]) {
        offsets.push(len);
        parts.push(words[i].text);
        len += words[i].text.length + 1;
        i++;
      }
      chunks.push({ start: j0, end: i, text: parts.join(" "), offsets });
    }

    wordsRef.current = words;
    chunksRef.current = chunks;
    setTotalWords(words.length);
    setReady(words.length > 0);

    const onUserScroll = () => {
      lastUserScrollRef.current = Date.now();
    };
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
      window.speechSynthesis.cancel();
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, [articleId]);

  // ---- highlight helpers (direct DOM, no per-word re-render) ----
  const applyReadState = useCallback((idx: number) => {
    const words = wordsRef.current;
    for (let i = 0; i < words.length; i++) {
      words[i].el.classList.toggle("nw-read", i < idx);
      words[i].el.classList.toggle("nw-current", i === idx);
    }
  }, []);

  const setCurrentWord = useCallback((idx: number) => {
    const words = wordsRef.current;
    const prev = wordIdxRef.current;
    if (words[prev]) words[prev].el.classList.remove("nw-current");
    if (words[prev] && idx > prev) words[prev].el.classList.add("nw-read");
    // Non-sequential jump (seek): recompute all read flags.
    if (idx !== prev + 1 && idx !== prev) {
      for (let i = 0; i < words.length; i++) {
        words[i].el.classList.toggle("nw-read", i < idx);
      }
    }
    const cur = words[idx];
    if (cur) {
      // Ink-fill sweep duration: base ms-per-word at the current rate, scaled
      // by word length so long words fill slower than short ones.
      const baseMs = 60000 / (BASE_WPM * rateRef.current);
      const lenScale = Math.min(2, Math.max(0.6, cur.text.length / 5));
      cur.el.style.setProperty("--wdur", `${Math.round(baseMs * lenScale)}ms`);
      cur.el.classList.add("nw-current");
      // Auto-scroll: keep the current word in a comfortable band, unless the
      // reader scrolled themselves in the last few seconds.
      if (Date.now() - lastUserScrollRef.current > 4000) {
        const r = cur.el.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.top < vh * 0.15 || r.bottom > vh * 0.65) {
          window.scrollTo({
            top: window.scrollY + r.top - vh * 0.35,
            behavior: "smooth",
          });
        }
      }
    }
    wordIdxRef.current = idx;
    setWordIdx(idx);
  }, []);

  const clearHighlights = useCallback(() => {
    proseRef.current?.classList.remove("narrating");
    for (const w of wordsRef.current) {
      w.el.classList.remove("nw-read", "nw-current");
    }
  }, []);

  // ---- playback engine ----
  // Strategy: pause/resume keeps the existing native queue intact. Restarts
  // that truly need a new queue (seek, jump, rate change) cancel once, then
  // speak a silent primer. Only the primer's real onstart event releases all
  // remaining chunks into the queue. This avoids guessing when cancel() has
  // settled and gives Chrome's native TTS backend sacrificial audio to clip.
  // The generation counter invalidates callbacks from older queues.

  const stop = useCallback(() => {
    genRef.current++;
    playingRef.current = false;
    pausedRef.current = false;
    window.speechSynthesis.cancel();
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    // The final utterance has already left the queue, so another cancel here
    // only creates teardown work that can interfere with the next play.
    genRef.current++;
    playingRef.current = false;
    pausedRef.current = false;
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    setPlaying(false);
    clearHighlights();
    wordIdxRef.current = 0;
    setWordIdx(0);
  }, [clearHighlights]);

  const startFrom = useCallback(
    (idx: number, alreadyStopped = false) => {
      const chunks = chunksRef.current;
      const ci = chunks.findIndex((c) => idx >= c.start && idx < c.end);
      if (ci === -1) return;

      // Seeking stops on pointer-down so narration is quiet while dragging.
      // Reuse that cancellation on pointer-up instead of issuing a second one.
      if (!alreadyStopped) stop();
      const gen = genRef.current;
      playingRef.current = true;
      pausedRef.current = false;
      setPlaying(true);
      proseRef.current?.classList.add("narrating");
      wordIdxRef.current = idx;
      applyReadState(idx);
      setCurrentWord(idx);

      // Chrome silently pauses synthesis that runs >~15s on some voices;
      // a periodic resume() keeps it alive (no-op while actually speaking).
      if (!keepAliveRef.current) {
        keepAliveRef.current = setInterval(() => {
          if (playingRef.current) window.speechSynthesis.resume();
        }, 10000);
      }

      let anyStarted = false;
      let queueStarted = false;
      let primerAttempt = 0;
      let queueRecoveryUsed = false;

      const queueAll = () => {
        if (queueStarted || genRef.current !== gen || !playingRef.current)
          return;
        queueStarted = true;
        for (let k = ci; k < chunks.length; k++) {
          const chunk = chunks[k];
          const localStart = k === ci ? idx - chunk.start : 0;
          const charStart = chunk.offsets[localStart] ?? 0;
          const utter = new SpeechSynthesisUtterance(
            CHUNK_LEAD_IN + chunk.text.slice(charStart)
          );
          utter.rate = rateRef.current;
          utter.onstart = () => {
            if (genRef.current !== gen) return;
            anyStarted = true;
            // Snap the highlight to this chunk's first spoken word even if
            // the engine skips the boundary event at the utterance head.
            const first = chunk.start + localStart;
            if (wordIdxRef.current < first) setCurrentWord(first);
          };
          utter.onboundary = (e) => {
            if (genRef.current !== gen) return;
            // Ignore any boundary the voice reports for the protective
            // punctuation, then translate back into the chunk's text.
            if (e.charIndex < CHUNK_LEAD_IN.length) return;
            const absChar = charStart + e.charIndex - CHUNK_LEAD_IN.length;
            // Find the word whose offset is <= absChar (offsets are sorted).
            let w = localStart;
            for (let j = localStart; j < chunk.offsets.length; j++) {
              if (chunk.offsets[j] <= absChar) w = j;
              else break;
            }
            setCurrentWord(chunk.start + w);
          };
          if (k === chunks.length - 1) {
            utter.onend = () => {
              if (genRef.current !== gen) return;
              finish();
            };
          }
          utter.onerror = (e) => {
            // "interrupted"/"canceled" fire on our own cancel() calls.
            if (e.error === "interrupted" || e.error === "canceled") return;
            if (genRef.current !== gen) return;
            finish();
          };
          window.speechSynthesis.speak(utter);
        }

        // Abnormal recovery only: the normal path is event-gated and has no
        // fixed delay. If a browser accepts the queue but emits no start event,
        // re-prime once instead of leaving the player stuck forever.
        setTimeout(() => {
          if (
            genRef.current === gen &&
            playingRef.current &&
            !anyStarted &&
            !queueRecoveryUsed
          ) {
            queueRecoveryUsed = true;
            queueStarted = false;
            window.speechSynthesis.cancel();
            primeQueue();
          }
        }, PRIMER_START_TIMEOUT_MS);
      };

      const primeQueue = () => {
        if (genRef.current !== gen || !playingRef.current) return;
        const attempt = ++primerAttempt;
        const primer = new SpeechSynthesisUtterance(RESTART_PRIMER_TEXT);
        primer.volume = 0;
        primer.rate = RESTART_PRIMER_RATE;

        // Queue the article while the primer is actively being synthesized,
        // so the primer -> first chunk hand-off stays inside the native queue.
        const releaseQueue = () => {
          if (attempt !== primerAttempt) return;
          queueAll();
        };
        primer.onstart = releaseQueue;
        // Some voices omit onstart for a muted utterance; onend is a safe,
        // later fallback that still proves the primer crossed the engine.
        primer.onend = releaseQueue;
        primer.onerror = () => {
          if (
            attempt !== primerAttempt ||
            genRef.current !== gen ||
            !playingRef.current ||
            queueStarted
          )
            return;
          if (attempt < 2) {
            // A late platform cancellation may consume the first primer. The
            // replacement remains sacrificial; no article word is exposed.
            primeQueue();
          } else {
            queueAll();
          }
        };

        window.speechSynthesis.speak(primer);
        // cancel() does not reset the paused state by specification. Calling
        // resume after an utterance exists works in Chrome as well as spec-
        // conforming implementations and prevents a silently paused queue.
        window.speechSynthesis.resume();

        setTimeout(() => {
          if (
            attempt !== primerAttempt ||
            genRef.current !== gen ||
            !playingRef.current ||
            queueStarted
          )
            return;
          if (attempt < 2) {
            window.speechSynthesis.cancel();
            primeQueue();
          } else {
            queueAll();
          }
        }, PRIMER_START_TIMEOUT_MS);
      };

      primeQueue();
    },
    [stop, finish, applyReadState, setCurrentWord]
  );

  const play = useCallback(() => {
    if (pausedRef.current) {
      pausedRef.current = false;
      playingRef.current = true;
      setPlaying(true);
      proseRef.current?.classList.add("narrating");
      applyReadState(wordIdxRef.current);
      setCurrentWord(wordIdxRef.current);
      window.speechSynthesis.resume();
      return;
    }
    startFrom(wordIdxRef.current);
  }, [startFrom, applyReadState, setCurrentWord]);

  const pause = useCallback(() => {
    playingRef.current = false;
    pausedRef.current = true;
    window.speechSynthesis.pause();
    setPlaying(false);
    // Paused: the native queue and exact audio position are preserved.
    clearHighlights();
  }, [clearHighlights]);

  const restart = useCallback(() => {
    startFrom(0);
  }, [startFrom]);

  // While narrating, clicking any word jumps playback there. Capture phase +
  // preventDefault so words inside links jump instead of navigating.
  useEffect(() => {
    if (!ready) return;
    const prose = proseRef.current;
    if (!prose) return;
    const onClick = (e: MouseEvent) => {
      if (!playingRef.current) return;
      const el = (e.target as HTMLElement).closest?.(
        ".nw"
      ) as HTMLElement | null;
      if (!el?.dataset.nwi) return;
      e.preventDefault();
      const idx = parseInt(el.dataset.nwi, 10);
      setWordIdx(idx);
      startFrom(idx);
    };
    prose.addEventListener("click", onClick, true);
    return () => prose.removeEventListener("click", onClick, true);
  }, [ready, startFrom]);

  const selectRate = useCallback(
    (idx: number) => {
      setRateIdx(idx);
      rateRef.current = RATES[idx];
      setSpeedOpen(false);
      // Utterance properties are not reliably mutable after speak(), so a
      // live rate change needs a rebuilt queue. If currently paused, discard
      // the old-rate queue and build the new one on the next Play instead.
      if (playingRef.current) {
        startFrom(wordIdxRef.current);
      } else if (pausedRef.current) {
        stop();
        setPlaying(false);
        clearHighlights();
      }
    },
    [startFrom, stop, clearHighlights]
  );

  // ---- seek via progress track ----
  const seekToFraction = useCallback(
    (frac: number, resume: boolean, alreadyStopped = false) => {
      const total = wordsRef.current.length;
      const idx = Math.min(
        total - 1,
        Math.max(0, Math.round(frac * (total - 1)))
      );
      if (resume) {
        setWordIdx(idx);
        startFrom(idx, alreadyStopped);
      } else {
        if (!alreadyStopped) stop();
        wordIdxRef.current = idx;
        setWordIdx(idx);
        applyReadState(idx);
      }
    },
    [stop, startFrom, applyReadState]
  );

  const fractionFromEvent = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const r = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  }, []);

  const onTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const wasPlaying = playingRef.current;
      stop();
      setDragging(true);
      const move = (ev: PointerEvent) => {
        const frac = fractionFromEvent(ev.clientX);
        const total = wordsRef.current.length;
        const idx = Math.min(
          total - 1,
          Math.max(0, Math.round(frac * (total - 1)))
        );
        wordIdxRef.current = idx;
        setWordIdx(idx);
      };
      const up = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setDragging(false);
        seekToFraction(fractionFromEvent(ev.clientX), wasPlaying, true);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      move(e.nativeEvent);
    },
    [stop, fractionFromEvent, seekToFraction]
  );

  const onTrackKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const total = wordsRef.current.length;
      if (total < 2) return;

      const current = wordIdxRef.current / (total - 1);
      const step = e.shiftKey ? 0.05 : 0.01;
      let next: number | null = null;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        next = current - step;
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        next = current + step;
      } else if (e.key === "Home") {
        next = 0;
      } else if (e.key === "End") {
        next = 1;
      }

      if (next === null) return;
      e.preventDefault();
      seekToFraction(Math.min(1, Math.max(0, next)), playingRef.current);
    },
    [seekToFraction]
  );

  if (!supported || !ready) return null;

  const rate = RATES[rateIdx];
  const durationSec = (totalWords / (BASE_WPM * rate)) * 60;
  const elapsedSec = totalWords > 0 ? (wordIdx / totalWords) * durationSec : 0;
  const progress = totalWords > 1 ? wordIdx / (totalWords - 1) : 0;

  return (
    <div className="border-border bg-secondary/15 mb-6 rounded-md border p-2.5 sm:p-3">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={playing ? pause : play}
          aria-label={playing ? "Pause narration" : "Play narration"}
          className="text-foreground/80 hover:bg-foreground/[0.06] hover:text-foreground flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-[color,background-color,transform] duration-200 ease-out focus-visible:!rounded-full active:scale-95 motion-reduce:transition-none"
        >
          {playing ? (
            <Pause className="h-4.5 w-4.5 fill-current" />
          ) : (
            <Play className="ml-0.5 h-4.5 w-4.5 fill-current" />
          )}
        </button>

        <span className="text-muted-foreground/80 hidden w-9 shrink-0 text-right font-mono text-[11px] font-medium tabular-nums sm:block">
          {formatTime(elapsedSec)}
        </span>

        {/* Waveform progress track */}
        <div
          ref={trackRef}
          onPointerDown={onTrackPointerDown}
          role="slider"
          aria-label="Narration progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuetext={`${formatTime(elapsedSec)} of ${formatTime(durationSec)}`}
          tabIndex={0}
          onKeyDown={onTrackKeyDown}
          className={`group relative flex h-11 min-w-0 flex-1 cursor-pointer touch-none items-center rounded-md px-1.5 select-none sm:px-2 ${
            dragging ? "bg-foreground/[0.045]" : "hover:bg-foreground/[0.025]"
          }`}
        >
          <div className="relative h-8 w-full" aria-hidden="true">
            {/* Clipping and edge-fade live on this inner layer only, so the
                thumb (a sibling) never gets cut off at 0% or 100%. */}
            <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]">
              <svg
                viewBox="0 0 640 32"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
              <defs>
                <clipPath id={waveformClipId}>
                  <rect width={progress * 640} height="32" />
                </clipPath>
              </defs>

                <g className="text-foreground/[0.14]">
                  {barHeights.map((height, i) => {
                    const x = 5 + (i * 630) / (BAR_COUNT - 1);
                    const halfHeight = 3 + height * 11;
                    return (
                      <line
                        key={`base-${i}`}
                        // On narrow screens the track is much shorter, so
                        // every other bar is dropped to keep the same airy
                        // rhythm instead of a dense picket fence.
                        className={i % 2 === 1 ? "max-sm:hidden" : undefined}
                        x1={x}
                        x2={x}
                        y1={16 - halfHeight}
                        y2={16 + halfHeight}
                        stroke="currentColor"
                        strokeWidth="1.35"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </g>

                <g
                  clipPath={`url(#${waveformClipId})`}
                  className="text-foreground/85"
                >
                  {barHeights.map((height, i) => {
                    const x = 5 + (i * 630) / (BAR_COUNT - 1);
                    const halfHeight = 3 + height * 11;
                    return (
                      <line
                        key={`played-${i}`}
                        className={i % 2 === 1 ? "max-sm:hidden" : undefined}
                        x1={x}
                        x2={x}
                        y1={16 - halfHeight}
                        y2={16 + halfHeight}
                        stroke="currentColor"
                        strokeWidth="1.35"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </g>
              </svg>
            </div>

            <span
              className="bg-foreground/80 absolute top-1/2 h-7 w-px -translate-x-1/2 -translate-y-1/2 transition-[left,opacity] duration-150 ease-out motion-reduce:transition-none"
              style={{ left: `${progress * 100}%` }}
            >
              <span className="bg-foreground ring-background absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-transform duration-200 ease-out group-hover:scale-125 motion-reduce:transition-none" />
            </span>
          </div>
        </div>

        <span className="text-muted-foreground/80 hidden w-9 shrink-0 font-mono text-[11px] font-medium tabular-nums sm:block">
          {formatTime(durationSec)}
        </span>

        {/* Speed dropdown */}
        <div ref={speedMenuRef} className="relative shrink-0">
          <button
            onClick={() => setSpeedOpen((o) => !o)}
            aria-label="Narration speed"
            aria-expanded={speedOpen}
            aria-haspopup="listbox"
            className="text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground flex h-8 min-w-10 cursor-pointer items-center justify-center gap-0.5 rounded-md px-1 font-mono text-[11px] font-bold transition-colors duration-200"
          >
            {rate}x
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 motion-reduce:transition-none ${
                speedOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {speedOpen && (
            <div
              role="listbox"
              aria-label="Narration speed"
              className="border-border bg-background absolute top-full right-0 z-20 mt-1.5 w-24 overflow-hidden rounded-md border py-1 shadow-lg"
            >
              {RATES.map((r, i) => (
                <button
                  key={r}
                  role="option"
                  aria-selected={i === rateIdx}
                  onClick={() => selectRate(i)}
                  className={`hover:bg-secondary flex w-full cursor-pointer items-center justify-between px-3 py-2 font-mono text-[11px] transition-colors sm:py-1.5 ${
                    i === rateIdx
                      ? "text-foreground font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {r}x{i === rateIdx && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={restart}
          aria-label="Restart narration"
          className="text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 focus-visible:!rounded-full"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
