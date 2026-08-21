"use client";

import { NARRATION_VIEWPORT_OVERRIDE_EVENT } from "@/lib/narration-events";
import { Check, ChevronDown, Pause, Play, RotateCcw } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
// Only used for the per-word ink sweep duration; the clock is the audio itself.
const BASE_WPM = 170;
const WAVEFORM_VIEWBOX_WIDTH = 640;
const WAVEFORM_EDGE_INSET = 5;
const WAVEFORM_BAR_SPAN = WAVEFORM_VIEWBOX_WIDTH - WAVEFORM_EDGE_INSET * 2;
const BAR_COUNT = 64;
const VIEWPORT_RETURN_IDLE_MS = 6000;
const USER_SCROLL_IDLE_MS = 4000;
const LABEL_THROTTLE_MS = 250;

// Subtrees that carry no narrated words. Mirrors NARRATION_SKIP_TAGS in
// lib/rehype-narrate.ts — the build numbered the words with these same rules,
// so the wrapper below has to skip exactly the same things or the indices it
// assigns stop matching the timings.
const SKIP_TAGS = new Set([
  "PRE",
  "CODE",
  "TABLE",
  "IMG",
  "FIGURE",
  "FIGCAPTION",
  "SCRIPT",
  "STYLE",
  "SVG",
]);

// Static geometry should not be recalculated for every player mount.
const WAVEFORM_BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const phrase = 0.46 + 0.2 * Math.sin(i * 0.32 + 0.4);
  const syllable = 0.12 * Math.sin(i * 1.17 + 1.1);
  const breath = 0.08 * Math.cos(i * 0.13);
  return Math.min(0.88, Math.max(0.2, phrase + syllable + breath));
});

interface StableRef<T> {
  current: T;
}

interface NarrationWaveformVisualProps {
  barsRef: StableRef<(SVGLineElement | null)[]>;
  dotPositionRef: StableRef<HTMLSpanElement | null>;
  visualTrackRef: StableRef<HTMLDivElement | null>;
}

// Progress and played-bar state are written directly through these stable
// refs. Memoizing the static visual keeps per-word time/label state updates in
// the player from reconciling all 64 SVG lines.
const NarrationWaveformVisual = memo(function NarrationWaveformVisual({
  barsRef,
  dotPositionRef,
  visualTrackRef,
}: NarrationWaveformVisualProps) {
  return (
    <div
      ref={visualTrackRef}
      className="relative h-8 w-full"
      aria-hidden="true"
    >
      {/* Each bar is one persistent line, either dim or "played" — toggled by
          class, not revealed by a moving clip mask. */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          viewBox={`0 0 ${WAVEFORM_VIEWBOX_WIDTH} 32`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {/* The bars have no stroke of their own — they inherit currentColor
              from this group, and the played ones are lifted to full strength
              by the nb-played class the playback loop toggles. */}
          <g className="text-foreground/20 [&_.nb-played]:text-foreground">
            {WAVEFORM_BAR_HEIGHTS.map((height, i) => {
              const x =
                WAVEFORM_EDGE_INSET + (i * WAVEFORM_BAR_SPAN) / (BAR_COUNT - 1);
              const halfHeight = 3 + height * 11;
              return (
                <line
                  key={i}
                  ref={(el) => {
                    barsRef.current[i] = el;
                  }}
                  // Narrow screens drop every other bar to preserve the same
                  // airy rhythm instead of turning into a dense picket fence.
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
        // Playback owns this outer layer's transform. Hover scale stays on the
        // child so it cannot recompose the live position transform.
        className="pointer-events-none absolute top-1/2 left-0 h-[86%] w-[3px] will-change-transform"
      >
        <span className="bg-foreground ring-background absolute inset-0 rounded-full ring-2 transition-transform duration-150 ease-out group-hover:scale-x-150 motion-reduce:transition-none" />
      </span>
    </div>
  );
});

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Last word whose start time is at or before `ms`. */
function wordIdxForMs(starts: number[], ms: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= ms) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

type NarrationManifest = {
  audio: string;
  durationMs: number;
  starts: number[];
  count?: number;
};

/**
 * Read-along player for the pre-generated narration.
 *
 * Word identity is settled at build: `rehypeNarrate` stamps every narrated
 * block with the range of narration tokens it holds (`data-nwb` / `data-nwc`),
 * and the manifest's `starts[i]` is the start time of token `i`. That leaves
 * the browser three jobs — split the anchored blocks into word spans, binary
 * search the current time, toggle a class — instead of walking the article with
 * a TreeWalker, building a Range per word, and fuzzy-matching two token lists
 * on every page load.
 *
 * The spans are created on first playback rather than at mount or on the
 * server: a long post is ~3,000 of them, and the large majority of readers
 * never press play.
 */
export function BlogNarrator({
  articleId,
  slug,
  year,
  available = true,
}: {
  articleId: string;
  slug: string;
  year: number | string;
  /** False when the build could not line the timings up with this article. */
  available?: boolean;
}) {
  const [supported, setSupported] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rateIdx, setRateIdx] = useState(2); // 1x
  const [dragging, setDragging] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [curMs, setCurMs] = useState(0);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  const proseRef = useRef<HTMLElement | null>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);
  const wrappedRef = useRef(false);
  const startsRef = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSrcRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const rateRef = useRef(1);
  const wordIdxRef = useRef(0);
  const playingRef = useRef(false);
  const durationMsRef = useRef(0);
  // Position exists independently of the media element, so the timeline can be
  // scrubbed before play without ever requesting the MP3.
  const audioPositionMsRef = useRef(0);
  const lastLabelUpdateRef = useRef(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const visualTrackRef = useRef<HTMLDivElement>(null);
  const visualTrackWidthRef = useRef(0);
  const visualProgressRef = useRef(0);
  const dotPositionRef = useRef<HTMLSpanElement>(null);
  const barsRef = useRef<(SVGLineElement | null)[]>([]);
  const lastPlayedCountRef = useRef(-1);
  const dragRafRef = useRef<number | null>(null);
  const dragCleanupRef = useRef<() => void>(() => undefined);

  const lastUserScrollRef = useRef(0);
  const viewportOverrideRef = useRef(false);
  const viewportOverrideTimerRef = useRef<number | null>(null);
  const returnToNarrationRef = useRef<() => void>(() => undefined);

  // Close the speed menu on outside click.
  useEffect(() => {
    if (!speedOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!speedMenuRef.current?.contains(e.target as Node)) {
        setSpeedOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [speedOpen]);

  // ---- the single writer of visual playback progress ----
  // Every path that changes position (the playback rAF loop, dragging, seeking,
  // mount) funnels through here, and it only ever assigns instantly — no CSS
  // transition, no React re-render in between — so exactly one thing decides
  // where the dot and bars sit at any moment.
  const setProgressUI = useCallback((fraction: number) => {
    const clamped = Math.min(1, Math.max(0, fraction));
    visualProgressRef.current = clamped;
    if (dotPositionRef.current) {
      // Keep the playhead's raster intact and translate that layer as a unit.
      // Width is cached by the ResizeObserver below, so the rAF loop does not
      // force layout every frame.
      const x = clamped * visualTrackWidthRef.current;
      dotPositionRef.current.style.transform = `translate3d(${x}px, -50%, 0) translateX(-50%)`;
    }

    // Compare playhead and bars in the SVG's own coordinate system. Bars are
    // inset from the 0–640 track edges, so an index-based percentage would flip
    // them before or after the playhead actually crosses.
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

  // ---- mount: read the build's anchors, load the manifest ----
  useEffect(() => {
    if (!available) {
      setSupported(false);
      return;
    }
    const prose = document.getElementById(articleId);
    const blocks = prose?.querySelectorAll<HTMLElement>("[data-nwb]");
    if (!prose || !blocks?.length) {
      setSupported(false);
      return;
    }
    proseRef.current = prose;

    let expected = 0;
    for (const block of blocks) expected += Number(block.dataset.nwc ?? 0);

    const controller = new AbortController();
    fetch(`/narration/${year}/${slug}.json`, { signal: controller.signal })
      .then((res) =>
        res.ok ? (res.json() as Promise<NarrationManifest>) : null
      )
      .then((data) => {
        if (!data || !Array.isArray(data.starts) || !data.audio) {
          setSupported(false);
          return;
        }
        // The anchors and the timings are generated together, so a mismatch
        // means one of them is stale. Highlighting the wrong words is worse
        // than not offering the player.
        if (data.starts.length !== expected) {
          setSupported(false);
          return;
        }
        startsRef.current = data.starts;
        audioSrcRef.current = data.audio;
        durationMsRef.current = data.durationMs;
        setDurationMs(data.durationMs);
        setReady(true);
      })
      .catch((err) => {
        if ((err as Error)?.name !== "AbortError") setSupported(false);
      });

    return () => controller.abort();
  }, [articleId, available, slug, year]);

  // ---- lazy word wrapping ----
  // Runs once, on the first action that needs word-level positions. Each block
  // carries its own start index, so a block whose rendered word count disagrees
  // with the build (an MDX component injecting text, say) only mistimes itself
  // — the next block re-anchors and the rest of the article stays correct.
  const ensureWrapped = useCallback(() => {
    if (wrappedRef.current) return wordsRef.current.length > 0;
    const prose = proseRef.current;
    if (!prose) return false;
    wrappedRef.current = true;

    const words: HTMLSpanElement[] = [];
    const blocks = prose.querySelectorAll<HTMLElement>("[data-nwb]");

    for (const block of blocks) {
      const base = Number(block.dataset.nwb ?? 0);
      let offset = 0;

      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !/\S/.test(node.nodeValue)) {
            return NodeFilter.FILTER_REJECT;
          }
          let el = node.parentElement;
          while (el && el !== block) {
            if (
              SKIP_TAGS.has(el.tagName) ||
              el.hasAttribute("data-no-narrate")
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            el = el.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

      for (const node of textNodes) {
        const fragment = document.createDocumentFragment();
        for (const token of node.data.split(/(\s+)/)) {
          if (!token) continue;
          if (/^\s+$/.test(token)) {
            fragment.appendChild(document.createTextNode(token));
            continue;
          }
          const span = document.createElement("span");
          span.className = "nw";
          const index = base + offset++;
          span.dataset.nwi = String(index);
          span.textContent = token;
          fragment.appendChild(span);
          words[index] = span;
        }
        node.parentNode?.replaceChild(fragment, node);
      }
    }

    wordsRef.current = words;
    return words.length > 0;
  }, []);

  // ---- highlight ----
  //
  // `seeked` forces the read/unread split to be recomputed rather than inferred
  // from the previous index. Playback advances one word at a time and only
  // needs to mark the word it just left, but a jump has to repaint everything
  // behind the playhead — and inferring "this was a jump" from `idx !== prev`
  // is only sound while nothing else writes wordIdxRef, which is exactly the
  // assumption scrubbing broke.
  //
  // `follow` is whether the article should scroll to keep up. It defaults to
  // "are we playing", which is right for the playback loop, but a seek has to
  // pass it explicitly: scrubbing pauses first, so by the time the position
  // lands playingRef is already false even when playback is about to resume.
  const applyHighlight = useCallback(
    (idx: number, seeked = false, follow = playingRef.current) => {
      const words = wordsRef.current;
      const prev = wordIdxRef.current;
      const cur = words[idx];

      words[prev]?.classList.remove("nw-current");
      if (!seeked && idx === prev + 1) {
        words[prev]?.classList.add("nw-read");
      } else if (seeked || idx !== prev) {
        // A jump: repaint the whole read/unread split. O(n), but not per frame.
        for (let i = 0; i < words.length; i++) {
          words[i]?.classList.toggle("nw-read", i < idx);
        }
      }

      if (cur) {
        const baseMs = 60000 / (BASE_WPM * rateRef.current);
        const lenScale = Math.min(
          2,
          Math.max(0.6, (cur.textContent?.length ?? 5) / 5)
        );
        cur.style.setProperty("--wdur", `${Math.round(baseMs * lenScale)}ms`);
        cur.classList.add("nw-current");
      }

      // Keep the spoken word in a comfortable band — but only while something is
      // actually being spoken. Dragging the scrubber on a paused player is the
      // reader looking around, and yanking the article to the playhead fights
      // that. Same for the reader having scrolled recently, or a table of
      // contents jump.
      if (
        follow &&
        cur &&
        !viewportOverrideRef.current &&
        Date.now() - lastUserScrollRef.current > USER_SCROLL_IDLE_MS
      ) {
        const r = cur.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.top < vh * 0.15 || r.bottom > vh * 0.65) {
          window.scrollTo({
            top: window.scrollY + r.top - vh * 0.35,
            behavior: "smooth",
          });
        }
      }

      wordIdxRef.current = idx;
    },
    []
  );

  const clearHighlights = useCallback(() => {
    proseRef.current?.classList.remove("narrating");
    for (const word of wordsRef.current) {
      word?.classList.remove("nw-read", "nw-current");
    }
  }, []);

  // ---- playback ----
  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // The loop re-schedules itself through a ref: a useCallback cannot reference
  // its own identity, and reading the latest one each frame also means a rate
  // or highlight change is picked up without tearing down the loop.
  const tickRef = useRef<() => void>(() => undefined);
  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const ms = audio.currentTime * 1000;
    audioPositionMsRef.current = ms;

    const idx = wordIdxForMs(startsRef.current, ms);
    if (idx !== wordIdxRef.current) applyHighlight(idx);

    setProgressUI(durationMsRef.current > 0 ? ms / durationMsRef.current : 0);

    const now = performance.now();
    if (now - lastLabelUpdateRef.current > LABEL_THROTTLE_MS) {
      lastLabelUpdateRef.current = now;
      setCurMs(ms);
    }
    rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, [applyHighlight, setProgressUI]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(audioSrcRef.current);
    audio.preload = "auto";
    audio.playbackRate = rateRef.current;
    audio.currentTime = audioPositionMsRef.current / 1000;
    audio.onended = () => {
      playingRef.current = false;
      setPlaying(false);
      stopLoop();
      clearHighlights();
      audioPositionMsRef.current = 0;
      wordIdxRef.current = 0;
      setCurMs(0);
      setProgressUI(0);
    };
    audio.onerror = () => {
      playingRef.current = false;
      setPlaying(false);
      stopLoop();
      setFailed(true);
    };
    audioRef.current = audio;
    return audio;
  }, [clearHighlights, setProgressUI, stopLoop]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    stopLoop();
    audioRef.current?.pause();
    // Drop only the `narrating` class, which is what dims everything that has
    // not been read yet. The per-word nw-read/nw-current classes stay, so the
    // article returns to its normal colour while paused and resuming picks the
    // highlight straight back up instead of repainting 3,000 spans.
    proseRef.current?.classList.remove("narrating");
  }, [stopLoop]);

  const play = useCallback(() => {
    if (!ready) return;
    if (!ensureWrapped()) {
      setSupported(false);
      return;
    }
    setFailed(false);
    const audio = ensureAudio();
    audio.playbackRate = rateRef.current;
    proseRef.current?.classList.add("narrating");
    applyHighlight(wordIdxRef.current, true, true);
    playingRef.current = true;
    setPlaying(true);
    stopLoop();
    rafRef.current = requestAnimationFrame(() => tickRef.current());
    audio.play().catch(() => {
      playingRef.current = false;
      setPlaying(false);
      stopLoop();
      setFailed(true);
    });
  }, [applyHighlight, ensureAudio, ensureWrapped, ready, stopLoop]);

  const seekToMs = useCallback(
    (ms: number, resume: boolean) => {
      const clamped = Math.min(
        Math.max(0, ms),
        Math.max(0, durationMsRef.current)
      );
      audioPositionMsRef.current = clamped;
      setCurMs(clamped);
      setProgressUI(
        durationMsRef.current > 0 ? clamped / durationMsRef.current : 0
      );

      if (ensureWrapped()) {
        applyHighlight(wordIdxForMs(startsRef.current, clamped), true, resume);
      }
      if (audioRef.current) audioRef.current.currentTime = clamped / 1000;
      if (resume) play();
    },
    [applyHighlight, ensureWrapped, play, setProgressUI]
  );

  const seekToFraction = useCallback(
    (fraction: number, resume: boolean) => {
      seekToMs(fraction * durationMsRef.current, resume);
    },
    [seekToMs]
  );

  // Rewinds to the first word and leaves playback as it found it — restarting
  // while paused should not start speech. (`wasPlaying || true` is always true;
  // it made this button an unconditional play.)
  const restart = useCallback(() => {
    const wasPlaying = playingRef.current;
    if (wasPlaying) pause();
    seekToMs(0, wasPlaying);
  }, [pause, seekToMs]);

  const selectRate = useCallback((idx: number) => {
    setRateIdx(idx);
    setSpeedOpen(false);
    rateRef.current = RATES[idx];
    // Native playbackRate applies live — no queue to rebuild, no restart.
    if (audioRef.current) audioRef.current.playbackRate = RATES[idx];
  }, []);

  const onPrimaryAction = useCallback(() => {
    if (!ready) return;
    if (playingRef.current) pause();
    else play();
  }, [pause, play, ready]);

  // Tear down on unmount.
  useEffect(() => {
    return () => {
      stopLoop();
      dragCleanupRef.current();
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (viewportOverrideTimerRef.current !== null) {
        window.clearTimeout(viewportOverrideTimerRef.current);
      }
    };
  }, [stopLoop]);

  // ---- viewport follow ----
  useEffect(() => {
    const markUserScroll = () => {
      lastUserScrollRef.current = Date.now();
    };
    window.addEventListener("wheel", markUserScroll, { passive: true });
    window.addEventListener("touchmove", markUserScroll, { passive: true });
    window.addEventListener("keydown", markUserScroll);
    return () => {
      window.removeEventListener("wheel", markUserScroll);
      window.removeEventListener("touchmove", markUserScroll);
      window.removeEventListener("keydown", markUserScroll);
    };
  }, []);

  useEffect(() => {
    returnToNarrationRef.current = () => applyHighlight(wordIdxRef.current);
    return () => {
      returnToNarrationRef.current = () => undefined;
    };
  }, [applyHighlight]);

  // A table-of-contents jump means the reader wants to be somewhere else for a
  // moment; auto-scroll steps aside and then resumes where playback got to.
  useEffect(() => {
    const onOverride = () => {
      viewportOverrideRef.current = true;
      if (viewportOverrideTimerRef.current !== null) {
        window.clearTimeout(viewportOverrideTimerRef.current);
      }
      viewportOverrideTimerRef.current = window.setTimeout(() => {
        viewportOverrideRef.current = false;
        viewportOverrideTimerRef.current = null;
        if (playingRef.current) returnToNarrationRef.current();
      }, VIEWPORT_RETURN_IDLE_MS);
    };
    window.addEventListener(NARRATION_VIEWPORT_OVERRIDE_EVENT, onOverride);
    return () =>
      window.removeEventListener(NARRATION_VIEWPORT_OVERRIDE_EVENT, onOverride);
  }, []);

  // ---- click a word to jump there ----
  // Capture phase, and only while playing, so links stay clickable otherwise.
  useEffect(() => {
    const prose = proseRef.current;
    if (!prose || !ready) return;
    const onClick = (e: MouseEvent) => {
      if (!playingRef.current) return;
      const span = (e.target as HTMLElement)?.closest?.(
        ".nw"
      ) as HTMLElement | null;
      if (!span?.dataset.nwi) return;
      const idx = Number(span.dataset.nwi);
      if (!Number.isFinite(idx)) return;
      e.preventDefault();
      e.stopPropagation();
      seekToMs(startsRef.current[idx] ?? 0, true);
    };
    prose.addEventListener("click", onClick, true);
    return () => prose.removeEventListener("click", onClick, true);
  }, [ready, seekToMs]);

  // ---- scrubbing ----
  const fractionAt = useCallback((clientX: number) => {
    const track = visualTrackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }, []);

  const onTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const wasPlaying = playingRef.current;
      if (wasPlaying) pause();
      setDragging(true);

      let pendingClientX = e.clientX;
      const renderDragFrame = () => {
        dragRafRef.current = null;
        const frac = fractionAt(pendingClientX);
        const ms = frac * durationMsRef.current;
        setProgressUI(frac);
        audioPositionMsRef.current = ms;
        setCurMs(ms);
      };
      const move = (ev: PointerEvent) => {
        pendingClientX = ev.clientX;
        if (dragRafRef.current === null) {
          dragRafRef.current = requestAnimationFrame(renderDragFrame);
        }
      };
      const cleanupDrag = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        if (dragRafRef.current !== null) {
          cancelAnimationFrame(dragRafRef.current);
          dragRafRef.current = null;
        }
        dragCleanupRef.current = () => undefined;
      };
      const up = (ev: PointerEvent) => {
        if (ev.type !== "pointercancel") pendingClientX = ev.clientX;
        cleanupDrag();
        renderDragFrame();
        setDragging(false);
        seekToFraction(fractionAt(pendingClientX), wasPlaying);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
      dragCleanupRef.current = cleanupDrag;
      move(e.nativeEvent);
    },
    [fractionAt, pause, seekToFraction, setProgressUI]
  );

  const onTrackKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (durationMsRef.current <= 0) return;
      const current = audioPositionMsRef.current / durationMsRef.current;
      const step = e.shiftKey ? 0.05 : 0.01;
      let next: number | null = null;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - step;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp")
        next = current + step;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = 1;

      if (next === null) return;
      e.preventDefault();
      seekToFraction(Math.min(1, Math.max(0, next)), playingRef.current);
    },
    [seekToFraction]
  );

  const rate = RATES[rateIdx];
  const durationSec = durationMs / 1000;
  const elapsedSec = curMs / 1000;
  const progress = durationMs > 0 ? Math.min(1, curMs / durationMs) : 0;

  // Position updates that do not come from the rAF loop (mount, pause, seek by
  // click or keyboard) reach the single writer through here. While audio is
  // playing this is a no-op write of the value the loop just set.
  useEffect(() => {
    setProgressUI(progress);
  }, [progress, setProgressUI, ready]);

  if (!supported) return null;

  return (
    <div
      aria-busy={!ready}
      data-narration-state={ready ? "ready" : "loading"}
      className="blog-narrator border-border bg-secondary/15 mb-6 rounded-md border p-2.5 sm:p-3"
    >
      <span className="sr-only" role="status" aria-live="polite">
        {failed
          ? "Narration audio could not be loaded. Press play to retry."
          : ready
            ? "Narration ready."
            : "Preparing narration."}
      </span>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onPrimaryAction}
          aria-label={
            ready
              ? playing
                ? "Pause narration"
                : failed
                  ? "Retry narration"
                  : "Play narration"
              : "Play narration when ready"
          }
          // Full strength, not the /80 it used to sit at. This is the primary
          // control in the component; dimming it at rest put it below the
          // played waveform beside it in the visual order.
          className="narrator-primary-control text-foreground hover:bg-foreground/6 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-[color,background-color,transform,opacity] duration-200 ease-out focus-visible:rounded-full! active:scale-95 motion-reduce:transition-none"
        >
          {playing ? (
            <Pause className="h-4.5 w-4.5 fill-current" />
          ) : (
            <Play className="ml-0.5 h-4.5 w-4.5 fill-current" />
          )}
        </button>

        <span className="narrator-deferred-control text-muted-foreground text-2xs hidden w-9 shrink-0 text-right font-mono font-medium tabular-nums sm:block">
          {formatTime(elapsedSec)}
        </span>

        {/* Waveform progress track */}
        <div
          ref={trackRef}
          onPointerDown={ready ? onTrackPointerDown : undefined}
          role="slider"
          aria-label="Narration progress"
          aria-disabled={!ready}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuetext={`${formatTime(elapsedSec)} of ${formatTime(durationSec)}`}
          tabIndex={ready ? 0 : -1}
          onKeyDown={onTrackKeyDown}
          className={`narrator-deferred-control group relative flex h-11 min-w-0 flex-1 touch-none items-center rounded-md px-1.5 select-none sm:px-2 ${
            ready ? "cursor-pointer" : "cursor-wait"
          } ${dragging ? "bg-foreground/4.5" : "hover:bg-foreground/2.5"}`}
        >
          <NarrationWaveformVisual
            barsRef={barsRef}
            dotPositionRef={dotPositionRef}
            visualTrackRef={visualTrackRef}
          />
        </div>

        <span className="narrator-deferred-control text-muted-foreground text-2xs hidden w-9 shrink-0 font-mono font-medium tabular-nums sm:block">
          {formatTime(durationSec)}
        </span>

        {/* Speed dropdown */}
        <div
          ref={speedMenuRef}
          className="narrator-deferred-control relative shrink-0"
        >
          <button
            onClick={() => setSpeedOpen((o) => !o)}
            disabled={!ready}
            // The rate has to appear in the accessible name, not just in the
            // visible text: a bare "Narration speed" label overrode the "1x" on
            // screen, so a voice-control user saying the label they can see
            // addressed nothing (WCAG 2.5.3, Label in Name).
            aria-label={`Narration speed: ${rate}x`}
            aria-expanded={speedOpen}
            aria-haspopup="listbox"
            className="text-muted-foreground hover:bg-foreground/6 hover:text-foreground text-2xs flex h-8 min-w-10 cursor-pointer items-center justify-center gap-0.5 rounded-md px-1 font-mono font-bold transition-colors duration-200 disabled:cursor-wait"
          >
            {rate}x
            <ChevronDown
              aria-hidden="true"
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
                  className={`hover:bg-secondary text-2xs flex w-full cursor-pointer items-center justify-between px-3 py-2 font-mono transition-colors sm:py-1.5 ${
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
          disabled={!ready}
          aria-label="Restart narration"
          className="narrator-deferred-control text-muted-foreground hover:bg-foreground/6 hover:text-foreground flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-[color,background-color,opacity] duration-200 focus-visible:rounded-full! disabled:cursor-wait"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
