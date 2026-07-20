"use client";

import { NARRATION_VIEWPORT_OVERRIDE_EVENT } from "@/lib/narration-events";
import { Check, ChevronDown, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
// Rough speaking pace of Web Speech voices at 1x, used only for the time labels.
const BASE_WPM = 170;
const WAVEFORM_VIEWBOX_WIDTH = 640;
const WAVEFORM_EDGE_INSET = 5;
const WAVEFORM_BAR_SPAN = WAVEFORM_VIEWBOX_WIDTH - WAVEFORM_EDGE_INSET * 2;
const BAR_COUNT = 64;
const VIEWPORT_RETURN_IDLE_MS = 6000;

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

// ---- pre-generated narration (Edge TTS) timings ----
// scripts/generate-narrations.mjs produces /narration/<year>/<slug>.json: the audio
// URL plus a start time for every spoken word. Those words come from the
// markdown source while ours come from the rendered DOM, so the two lists can
// disagree in small ways (tokenization, expanded numbers, skipped islands).
// alignTimings maps them tolerantly instead of assuming 1:1.

interface NarrationData {
  v: number;
  audio: string;
  durationMs: number;
  words: string[];
  starts: number[];
}

const normWord = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

// Returns a start time (ms) for every DOM word. Two-pointer walk: a TTS token
// may cover part of a DOM word (hyphenated words split by the service), several
// DOM words (merged tokens), or neither (spoken expansions like "2026" ->
// "twenty twenty-six" are dropped; unmatched DOM words are interpolated).
function alignTimings(
  domNorm: string[],
  ttsWords: string[],
  ttsStarts: number[],
  durationMs: number
): number[] {
  const n = domNorm.length;
  const starts: number[] = new Array(n).fill(-1);
  let k = 0; // dom cursor
  let acc = ""; // matched prefix of domNorm[k] built from partial TTS tokens

  for (let j = 0; j < ttsWords.length && k < n; j++) {
    const tn = normWord(ttsWords[j]);
    const t = ttsStarts[j];
    if (!tn) continue;
    // Punctuation-only DOM tokens ("—", "→") inherit the upcoming time.
    while (k < n && !domNorm[k]) {
      if (starts[k] < 0) starts[k] = t;
      k++;
    }
    if (k >= n) break;

    if (acc) {
      const next = acc + tn;
      if (domNorm[k].startsWith(next)) {
        acc = next.length >= domNorm[k].length ? "" : next;
        if (!acc) k++;
        continue;
      }
      // Continuation broke down; give up on this word and fall through.
      acc = "";
      k++;
      while (k < n && !domNorm[k]) {
        starts[k] = t;
        k++;
      }
      if (k >= n) break;
    }

    if (domNorm[k].startsWith(tn)) {
      starts[k] = t;
      acc = tn.length >= domNorm[k].length ? "" : tn;
      if (!acc) k++;
    } else if (tn.startsWith(domNorm[k])) {
      // One TTS token spans multiple DOM words.
      let rem = tn;
      while (k < n && rem && domNorm[k] && rem.startsWith(domNorm[k])) {
        starts[k] = t;
        rem = rem.slice(domNorm[k].length);
        k++;
      }
    } else {
      // Look a few DOM words ahead (DOM-side extras like emoji or un-narrated
      // inline islands); otherwise treat as a TTS-side extra and drop it.
      let found = -1;
      for (let d = 1; d <= 4 && k + d < n; d++) {
        if (domNorm[k + d] && domNorm[k + d].startsWith(tn)) {
          found = k + d;
          break;
        }
      }
      if (found >= 0) {
        while (k < found) {
          if (starts[k] < 0) starts[k] = t;
          k++;
        }
        starts[k] = t;
        acc = tn.length >= domNorm[k].length ? "" : tn;
        if (!acc) k++;
      }
    }
  }

  // Interpolate any unmatched words between their nearest anchors and force
  // the sequence monotonic, so highlighting can never run backwards.
  let prevIdx = -1;
  let prevVal = 0;
  for (let i = 0; i <= n; i++) {
    const val = i === n ? durationMs : starts[i];
    if (i < n && val < 0) continue;
    for (let j = prevIdx + 1; j < i; j++) {
      starts[j] = prevVal + ((val - prevVal) * (j - prevIdx)) / (i - prevIdx);
    }
    if (i < n) {
      starts[i] = Math.max(val, prevVal);
      prevVal = starts[i];
      prevIdx = i;
    }
  }
  return starts;
}

export function BlogNarrator({
  articleId,
  slug,
  year,
}: {
  articleId: string;
  slug: string;
  year: number | string;
}) {
  const [supported, setSupported] = useState(true);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rateIdx, setRateIdx] = useState(2); // 1x
  const [wordIdx, setWordIdx] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  // A restrained, deterministic waveform. The blended frequencies produce a
  // natural speech rhythm without the noisy equalizer look of random bars.
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
  const viewportOverrideRef = useRef(false);
  const viewportOverrideTimerRef = useRef<number | null>(null);
  const returnToNarrationRef = useRef<() => void>(() => undefined);
  const trackRef = useRef<HTMLDivElement>(null);
  const visualTrackRef = useRef<HTMLDivElement>(null);
  const visualTrackWidthRef = useRef(0);
  const visualProgressRef = useRef(0);
  // Progress dot and waveform bars: written to directly through setProgressUI
  // (below) rather than through React state/JSX style bindings. The dot moves
  // as one compositor-rasterized layer; changing `left` on every frame makes
  // the browser repaint each rounded edge at a different subpixel coverage,
  // which can look like the leading edge stretches before the rear catches up.
  const dotPositionRef = useRef<HTMLSpanElement>(null);
  const barsRef = useRef<(SVGLineElement | null)[]>([]);
  const lastPlayedCountRef = useRef(-1);
  // Incremented on every (re)start; stale utterance callbacks and pending
  // start-polls compare against it and bail, so rapid seeks can't race.
  const genRef = useRef(0);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- audio-mode state (pre-generated Edge TTS narration) ----
  // "speech" drives Web Speech; "audio" plays the generated MP3 and derives
  // the highlighted word from playback time. Speech remains the fallback.
  const [mode, setMode] = useState<"speech" | "audio">("speech");
  const [audioDurationMs, setAudioDurationMs] = useState(0);
  const [curMs, setCurMs] = useState(0);
  const modeRef = useRef<"speech" | "audio">("speech");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSrcRef = useRef("");
  const durationMsRef = useRef(0);
  // Playback position exists independently of the HTMLAudioElement. A reader
  // can scrub the timeline before pressing Play without creating the element
  // (and therefore without requesting the MP3).
  const audioPositionMsRef = useRef(0);
  // Start time (ms) for every DOM word, produced by alignTimings.
  const domStartsRef = useRef<number[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastLabelUpdateRef = useRef(0);

  // ---- the single writer of visual playback progress ----
  // Every path that changes position (the playback rAF loop, dragging,
  // seeking, mode switches, mount) funnels through this one function. It
  // only ever assigns instantly — no CSS transition, no React re-render in
  // between — so there is exactly one thing deciding where the dot and bars
  // sit at any moment, and it can't be fought or overwritten mid-motion.
  const setProgressUI = useCallback((fraction: number) => {
    const clamped = Math.min(1, Math.max(0, fraction));
    visualProgressRef.current = clamped;
    if (dotPositionRef.current) {
      // Keep the circle's raster intact and translate that layer as a unit.
      // Width is cached by the ResizeObserver below, so playback's rAF loop
      // does not force layout on every frame.
      const x = clamped * visualTrackWidthRef.current;
      dotPositionRef.current.style.transform = `translate3d(${x}px, -50%, 0) translateX(-50%)`;
    }

    // Compare the dot and bars in the SVG's own coordinate system. Bars are
    // inset from the 0–640 track edges, so an index-based percentage makes
    // them flip before or after the dot's center actually crosses them.
    const dotX = clamped * WAVEFORM_VIEWBOX_WIDTH;
    const count =
      dotX < WAVEFORM_EDGE_INSET
        ? 0
        : Math.min(
            BAR_COUNT,
            Math.floor(
              ((dotX - WAVEFORM_EDGE_INSET) * (BAR_COUNT - 1)) /
                WAVEFORM_BAR_SPAN
            ) + 1
          );
    const prev = lastPlayedCountRef.current;
    if (count !== prev) {
      const bars = barsRef.current;
      if (count > prev) {
        for (let i = Math.max(0, prev); i < count; i++) {
          bars[i]?.classList.add("nb-played");
        }
      } else {
        for (let i = count; i < prev; i++) {
          bars[i]?.classList.remove("nb-played");
        }
      }
      lastPlayedCountRef.current = count;
    }
  }, []);

  // A percentage transform is relative to the dot itself, not its track, so
  // cache the responsive track width and re-position after layout changes.
  useEffect(() => {
    const track = visualTrackRef.current;
    if (!track) return;

    const syncTrackWidth = () => {
      visualTrackWidthRef.current = track.getBoundingClientRect().width;
      setProgressUI(visualProgressRef.current);
    };

    syncTrackWidth();
    const observer = new ResizeObserver(syncTrackWidth);
    observer.observe(track);
    return () => observer.disconnect();
  }, [ready, setProgressUI]);

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

    const cancelIdleReturn = () => {
      if (viewportOverrideTimerRef.current !== null) {
        window.clearTimeout(viewportOverrideTimerRef.current);
        viewportOverrideTimerRef.current = null;
      }
    };
    const onUserActivity = () => {
      lastUserScrollRef.current = Date.now();
      if (viewportOverrideRef.current) cancelIdleReturn();
    };
    const onViewportOverride = () => {
      cancelIdleReturn();
      lastUserScrollRef.current = Date.now();
      viewportOverrideRef.current = true;
      viewportOverrideTimerRef.current = window.setTimeout(() => {
        viewportOverrideTimerRef.current = null;
        if (!viewportOverrideRef.current) return;
        viewportOverrideRef.current = false;
        lastUserScrollRef.current = 0;
        if (playingRef.current) returnToNarrationRef.current();
      }, VIEWPORT_RETURN_IDLE_MS);
    };
    window.addEventListener("wheel", onUserActivity, { passive: true });
    window.addEventListener("touchmove", onUserActivity, { passive: true });
    window.addEventListener("pointerdown", onUserActivity, { passive: true });
    window.addEventListener("keydown", onUserActivity);
    window.addEventListener(
      NARRATION_VIEWPORT_OVERRIDE_EVENT,
      onViewportOverride
    );

    return () => {
      window.removeEventListener("wheel", onUserActivity);
      window.removeEventListener("touchmove", onUserActivity);
      window.removeEventListener("pointerdown", onUserActivity);
      window.removeEventListener("keydown", onUserActivity);
      window.removeEventListener(
        NARRATION_VIEWPORT_OVERRIDE_EVENT,
        onViewportOverride
      );
      cancelIdleReturn();
      window.speechSynthesis.cancel();
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, [articleId]);

  // Load pre-generated narration timings, if this post has them. Any failure
  // simply leaves the component in Web Speech mode.
  useEffect(() => {
    if (!ready || !slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/narration/${year}/${slug}.json`);
        if (!res.ok) return;
        const data = (await res.json()) as NarrationData;
        if (
          cancelled ||
          !data?.audio ||
          !Array.isArray(data.words) ||
          data.words.length === 0 ||
          data.words.length !== data.starts?.length
        )
          return;
        const domNorm = wordsRef.current.map((w) => normWord(w.text));
        const alignedStarts = alignTimings(
          domNorm,
          data.words,
          data.starts,
          data.durationMs
        );
        domStartsRef.current = alignedStarts;
        audioSrcRef.current = data.audio;
        durationMsRef.current = data.durationMs;
        const initialMs = alignedStarts[wordIdxRef.current] ?? 0;
        audioPositionMsRef.current = initialMs;
        setCurMs(initialMs);
        setAudioDurationMs(data.durationMs);
        modeRef.current = "audio";
        setMode("audio");
      } catch {
        // network error / malformed JSON — keep the speech engine
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, slug, year]);

  // Unmount: stop the audio pipeline (speech teardown lives in the setup effect).
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      audioRef.current = null;
    },
    []
  );

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
      if (
        !viewportOverrideRef.current &&
        Date.now() - lastUserScrollRef.current > 4000
      ) {
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

  useEffect(() => {
    returnToNarrationRef.current = () => setCurrentWord(wordIdxRef.current);
    return () => {
      returnToNarrationRef.current = () => undefined;
    };
  }, [setCurrentWord]);

  const resumeViewportFollow = useCallback(() => {
    if (viewportOverrideTimerRef.current !== null) {
      window.clearTimeout(viewportOverrideTimerRef.current);
      viewportOverrideTimerRef.current = null;
    }
    viewportOverrideRef.current = false;
    lastUserScrollRef.current = 0;
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

      resumeViewportFollow();

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
    [stop, finish, applyReadState, setCurrentWord, resumeViewportFollow]
  );

  // ---- audio engine ----
  // The MP3 is the clock: a rAF loop reads currentTime, binary-searches the
  // per-word start times, and drives the same highlighter the speech engine
  // uses. Seeking and live rate changes are native <audio> features here.

  const wordIdxForMs = useCallback((ms: number) => {
    const starts = domStartsRef.current;
    if (!starts || starts.length === 0) return 0;
    let lo = 0;
    let hi = starts.length - 1;
    let idx = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (starts[mid] <= ms) {
        idx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return idx;
  }, []);

  // If the MP3 can't be fetched or decoded, degrade to Web Speech mid-flight,
  // continuing from the word that was being read.
  const fallbackToSpeech = useCallback(() => {
    const wasPlaying = playingRef.current;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    audioRef.current?.pause();
    audioRef.current = null;
    audioSrcRef.current = "";
    modeRef.current = "speech";
    setMode("speech");
    setCurMs(0);
    audioPositionMsRef.current = 0;
    if (wasPlaying) {
      startFrom(wordIdxRef.current);
    } else {
      playingRef.current = false;
      pausedRef.current = false;
      setPlaying(false);
    }
  }, [startFrom]);

  const audioFinish = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    playingRef.current = false;
    pausedRef.current = false;
    setPlaying(false);
    clearHighlights();
    wordIdxRef.current = 0;
    setWordIdx(0);
    setCurMs(0);
    audioPositionMsRef.current = 0;
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, [clearHighlights]);

  // Created lazily so the MP3 only downloads once playback is requested.
  const getAudio = useCallback(() => {
    if (!audioRef.current && audioSrcRef.current) {
      const a = new Audio(audioSrcRef.current);
      a.preload = "auto";
      a.onended = () => audioFinish();
      a.onerror = () => fallbackToSpeech();
      audioRef.current = a;
    }
    return audioRef.current;
  }, [audioFinish, fallbackToSpeech]);

  const audioTick = useCallback(() => {
    const a = audioRef.current;
    if (!a || !playingRef.current) return;
    const ms = a.currentTime * 1000;
    audioPositionMsRef.current = ms;
    const idx = wordIdxForMs(ms);
    if (idx !== wordIdxRef.current) setCurrentWord(idx);
    // Position is written directly every frame via the single setProgressUI
    // writer — see its definition for why this must never go through a
    // React-rendered `style` prop.
    if (durationMsRef.current > 0) {
      setProgressUI(ms / durationMsRef.current);
    }
    // Highlighting and position update every frame via refs; the React state
    // behind the time labels only needs a few updates per second.
    const now = performance.now();
    if (now - lastLabelUpdateRef.current > 250) {
      lastLabelUpdateRef.current = now;
      setCurMs(ms);
    }
    rafRef.current = requestAnimationFrame(audioTick);
  }, [wordIdxForMs, setCurrentWord, setProgressUI]);

  const audioPlay = useCallback(
    (seekMs?: number) => {
      resumeViewportFollow();
      const a = getAudio();
      if (!a) {
        fallbackToSpeech();
        return;
      }
      const targetMs = seekMs ?? audioPositionMsRef.current;
      a.currentTime = targetMs / 1000;
      audioPositionMsRef.current = targetMs;
      a.playbackRate = rateRef.current;
      playingRef.current = true;
      pausedRef.current = false;
      setPlaying(true);
      proseRef.current?.classList.add("narrating");
      const idx = wordIdxForMs(a.currentTime * 1000);
      wordIdxRef.current = idx;
      setWordIdx(idx);
      applyReadState(idx);
      setCurrentWord(idx);
      setCurMs(a.currentTime * 1000);
      a.play().catch(() => fallbackToSpeech());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(audioTick);
    },
    [
      getAudio,
      fallbackToSpeech,
      wordIdxForMs,
      applyReadState,
      setCurrentWord,
      audioTick,
      resumeViewportFollow,
    ]
  );

  const audioPause = useCallback(() => {
    audioRef.current?.pause();
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    playingRef.current = false;
    pausedRef.current = true;
    setPlaying(false);
    if (audioRef.current) {
      const ms = audioRef.current.currentTime * 1000;
      audioPositionMsRef.current = ms;
      setCurMs(ms);
    }
    // Same pause semantics as the speech engine: text returns to normal,
    // position is kept.
    clearHighlights();
  }, [clearHighlights]);

  const play = useCallback(() => {
    resumeViewportFollow();
    if (modeRef.current === "audio") {
      audioPlay();
      return;
    }
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
  }, [
    startFrom,
    applyReadState,
    setCurrentWord,
    audioPlay,
    resumeViewportFollow,
  ]);

  const pause = useCallback(() => {
    if (modeRef.current === "audio") {
      audioPause();
      return;
    }
    playingRef.current = false;
    pausedRef.current = true;
    window.speechSynthesis.pause();
    setPlaying(false);
    // Paused: the native queue and exact audio position are preserved.
    clearHighlights();
  }, [clearHighlights, audioPause]);

  const restart = useCallback(() => {
    if (modeRef.current === "audio") {
      audioPlay(0);
      return;
    }
    startFrom(0);
  }, [startFrom, audioPlay]);

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
      if (modeRef.current === "audio") {
        const starts = domStartsRef.current;
        if (starts) audioPlay(starts[idx]);
      } else {
        startFrom(idx);
      }
    };
    prose.addEventListener("click", onClick, true);
    return () => prose.removeEventListener("click", onClick, true);
  }, [ready, startFrom, audioPlay]);

  const selectRate = useCallback(
    (idx: number) => {
      setRateIdx(idx);
      rateRef.current = RATES[idx];
      setSpeedOpen(false);
      // Audio mode: playbackRate applies live, mid-word, no restart needed.
      if (modeRef.current === "audio") {
        if (audioRef.current) audioRef.current.playbackRate = RATES[idx];
        return;
      }
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
      if (modeRef.current === "audio") {
        const ms = frac * durationMsRef.current;
        const idx = wordIdxForMs(ms);
        setCurMs(ms);
        if (resume) {
          audioPlay(ms);
        } else {
          // Seek an existing element, but never create one just because the
          // timeline was dragged. The pending position is applied on Play.
          if (audioRef.current) audioRef.current.currentTime = ms / 1000;
          audioPositionMsRef.current = ms;
          wordIdxRef.current = idx;
          setWordIdx(idx);
          applyReadState(idx);
        }
        return;
      }
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
    [stop, startFrom, applyReadState, wordIdxForMs, audioPlay]
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
      if (modeRef.current === "audio") {
        // Quiet while dragging, like the speech engine's stop-on-pointer-down.
        audioRef.current?.pause();
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        playingRef.current = false;
      } else {
        stop();
      }
      setDragging(true);
      const move = (ev: PointerEvent) => {
        const frac = fractionFromEvent(ev.clientX);
        // Written immediately, not just via state: pointermove can fire
        // faster than React re-renders, and the dot should never lag a
        // real drag.
        setProgressUI(frac);
        if (modeRef.current === "audio") {
          const ms = frac * durationMsRef.current;
          const idx = wordIdxForMs(ms);
          setCurMs(ms);
          audioPositionMsRef.current = ms;
          wordIdxRef.current = idx;
          setWordIdx(idx);
          return;
        }
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
    [stop, fractionFromEvent, seekToFraction, wordIdxForMs, setProgressUI]
  );

  const onTrackKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const total = wordsRef.current.length;
      if (total < 2) return;

      const current =
        modeRef.current === "audio" && durationMsRef.current > 0
          ? audioPositionMsRef.current / durationMsRef.current
          : wordIdxRef.current / (total - 1);
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

  const rate = RATES[rateIdx];
  const isAudio = mode === "audio";
  // Audio mode shows real media time; speech mode keeps the WPM estimate.
  const durationSec = isAudio
    ? audioDurationMs / 1000
    : (totalWords / (BASE_WPM * rate)) * 60;
  const elapsedSec = isAudio
    ? curMs / 1000
    : totalWords > 0
      ? (wordIdx / totalWords) * durationSec
      : 0;
  const progress = isAudio
    ? audioDurationMs > 0
      ? Math.min(1, curMs / audioDurationMs)
      : 0
    : totalWords > 1
      ? wordIdx / (totalWords - 1)
      : 0;

  // Non-rAF-driven position updates (mount, pause, seek-by-click/keyboard,
  // mode switches, speech mode's per-word jumps) all funnel through React
  // state, so this is their path to the same single writer the playback
  // loop uses. It's a no-op write of the same value while audio is actively
  // playing (audioTick already set it a moment earlier), never a competing one.
  useEffect(() => {
    setProgressUI(progress);
    // `ready` isn't read in the body, but it gates whether the dot/bars are
    // even mounted — without it, the effect wouldn't re-fire (progress and
    // setProgressUI are unchanged) at the exact moment they first exist,
    // leaving them unstyled until the next unrelated progress change.
  }, [progress, setProgressUI, ready]);

  if (!supported || !ready) return null;

  return (
    <div className="border-border bg-secondary/15 mb-6 rounded-md border p-2.5 sm:p-3">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={playing ? pause : play}
          aria-label={playing ? "Pause narration" : "Play narration"}
          className="text-foreground/80 hover:bg-foreground/6 hover:text-foreground flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-[color,background-color,transform] duration-200 ease-out focus-visible:rounded-full! active:scale-95 motion-reduce:transition-none"
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
            dragging ? "bg-foreground/4.5" : "hover:bg-foreground/2.5"
          }`}
        >
          <div
            ref={visualTrackRef}
            className="relative h-8 w-full"
            aria-hidden="true"
          >
            {/* Each bar is one persistent line, either dim or "played" —
                toggled by class, not revealed by a moving clip mask. A clip
                rect sitting exactly at the play boundary is one more layer
                for a fast-moving edge to visually catch on; a plain class
                flip on a static element can't. */}
            <div className="absolute inset-0 overflow-hidden">
              <svg
                viewBox={`0 0 ${WAVEFORM_VIEWBOX_WIDTH} 32`}
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <g className="text-foreground/[0.14] [&_.nb-played]:text-foreground">
                  {barHeights.map((height, i) => {
                    const x =
                      WAVEFORM_EDGE_INSET +
                      (i * WAVEFORM_BAR_SPAN) / (BAR_COUNT - 1);
                    const halfHeight = 3 + height * 11;
                    return (
                      <line
                        key={i}
                        ref={(el) => {
                          barsRef.current[i] = el;
                        }}
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
              </svg>
            </div>

            <span
              ref={dotPositionRef}
              // Playback owns this outer layer's transform. Keeping hover
              // scale on the child prevents the browser from recomposing the
              // live position transform when hover begins or ends.
              className="pointer-events-none absolute top-1/2 left-0 size-2 will-change-transform"
            >
              <span className="bg-foreground ring-background absolute inset-0 rounded-full ring-2 transition-transform duration-150 ease-out group-hover:scale-125 motion-reduce:transition-none" />
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
            className="text-muted-foreground hover:bg-foreground/6 hover:text-foreground flex h-8 min-w-10 cursor-pointer items-center justify-center gap-0.5 rounded-md px-1 font-mono text-[11px] font-bold transition-colors duration-200"
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
          className="text-muted-foreground hover:bg-foreground/6 hover:text-foreground flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 focus-visible:rounded-full!"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
