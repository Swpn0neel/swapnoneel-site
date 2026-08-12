"use client";

import { NARRATION_VIEWPORT_OVERRIDE_EVENT } from "@/lib/narration-events";
import { Check, ChevronDown, Pause, Play, RotateCcw } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
// Rough speaking pace of Web Speech voices at 1x, used only for the time labels.
const BASE_WPM = 170;
const WAVEFORM_VIEWBOX_WIDTH = 640;
const WAVEFORM_EDGE_INSET = 5;
const WAVEFORM_BAR_SPAN = WAVEFORM_VIEWBOX_WIDTH - WAVEFORM_EDGE_INSET * 2;
const BAR_COUNT = 64;
const VIEWPORT_RETURN_IDLE_MS = 6000;
const PREPARATION_SLICE_MS = 6;
const PREPARATION_WORD_BATCH = 160;
const FALLBACK_DOM_WORD_BATCH = 80;
const NARRATION_READ_HIGHLIGHT = "narration-read";
const NARRATION_CURRENT_HIGHLIGHT = "narration-current";
const NARRATION_UNREAD_HIGHLIGHT = "narration-unread";

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

interface NarrationWord {
  block: HTMLElement;
  el: HTMLSpanElement | null;
  range: Range | null;
  text: string;
}

interface NodeWordLocation {
  endOffset: number;
  index: number;
  startOffset: number;
}

interface HighlightSetLike {
  add(range: Range): HighlightSetLike;
  delete(range: Range): boolean;
}

interface HighlightRegistryLike {
  delete(name: string): boolean;
  set(name: string, highlight: HighlightSetLike): void;
}

interface HighlightRuntime {
  current: HighlightSetLike;
  index: number;
  read: HighlightSetLike;
  registry: HighlightRegistryLike;
  unread: HighlightSetLike;
}

interface HighlightConstructorLike {
  new (...ranges: Range[]): HighlightSetLike;
}

interface IdleSchedulerLike {
  cancel?: (id: number) => void;
  request?: (callback: () => void, options: { timeout: number }) => number;
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

function getHighlightSupport(): {
  HighlightCtor: HighlightConstructorLike;
  registry: HighlightRegistryLike;
} | null {
  if (typeof CSS === "undefined" || typeof CSS.escape !== "function") {
    return null;
  }
  const HighlightCtor = (
    window as typeof window & { Highlight?: HighlightConstructorLike }
  ).Highlight;
  const registry = (CSS as typeof CSS & { highlights?: HighlightRegistryLike })
    .highlights;
  return HighlightCtor && registry ? { HighlightCtor, registry } : null;
}

function installHighlightStyles(articleId: string) {
  const articleSelector = `#${CSS.escape(articleId)}.narrating`;
  const style = document.createElement("style");
  style.dataset.narrationHighlightStyles = articleId;
  // Keep syntax that Turbopack does not yet optimize out of the build-time CSS
  // pipeline. This only reaches a browser after the Highlight API support check
  // and deferred Range preparation, so it adds no initial render work.
  style.textContent = `
${articleSelector}::highlight(${NARRATION_READ_HIGHLIGHT}),
${articleSelector}::highlight(${NARRATION_CURRENT_HIGHLIGHT}) {
  color: currentColor;
}

${articleSelector}::highlight(${NARRATION_UNREAD_HIGHLIGHT}) {
  color: color-mix(
    in srgb,
    hsl(var(--body-foreground)) 40%,
    hsl(var(--background)) 60%
  );
}`;
  document.head.appendChild(style);
  return () => style.remove();
}

function abortIfNeeded(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
}

function getIdleScheduler(): IdleSchedulerLike {
  const idleWindow = window as unknown as {
    cancelIdleCallback?: (id: number) => void;
    requestIdleCallback?: (
      callback: () => void,
      options: { timeout: number }
    ) => number;
  };
  return {
    cancel: idleWindow.cancelIdleCallback?.bind(window),
    request: idleWindow.requestIdleCallback?.bind(window),
  };
}

// Preparation always yields between bounded slices. Urgent work uses the next
// task after a queued Play; normal work waits for idle time after page load.
function yieldPreparationTurn(signal: AbortSignal, urgent: boolean) {
  return new Promise<void>((resolve, reject) => {
    const idleScheduler = getIdleScheduler();
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
      if (idleId !== null) idleScheduler.cancel?.(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
    const finish = () => {
      cleanup();
      resolve();
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    signal.addEventListener("abort", onAbort, { once: true });
    if (urgent || !idleScheduler.request) {
      timeoutId = window.setTimeout(finish, urgent ? 0 : 16);
    } else {
      idleId = idleScheduler.request(finish, { timeout: 750 });
    }
  });
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
async function alignTimings(
  domNorm: string[],
  ttsWords: string[],
  ttsStarts: number[],
  durationMs: number,
  signal: AbortSignal,
  isUrgent: () => boolean
): Promise<number[]> {
  const n = domNorm.length;
  const starts: number[] = new Array(n).fill(-1);
  let k = 0; // dom cursor
  let acc = ""; // matched prefix of domNorm[k] built from partial TTS tokens
  let sliceStarted = performance.now();

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

    if (
      j % PREPARATION_WORD_BATCH === 0 &&
      performance.now() - sliceStarted >= PREPARATION_SLICE_MS
    ) {
      await yieldPreparationTurn(signal, isUrgent());
      abortIfNeeded(signal);
      sliceStarted = performance.now();
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
    if (
      i % PREPARATION_WORD_BATCH === 0 &&
      performance.now() - sliceStarted >= PREPARATION_SLICE_MS
    ) {
      await yieldPreparationTurn(signal, isUrgent());
      abortIfNeeded(signal);
      sliceStarted = performance.now();
    }
  }
  return starts;
}

export function BlogNarrator({
  articleId,
  slug,
  year,
  initialWordCount = 0,
}: {
  articleId: string;
  slug: string;
  year: number | string;
  initialWordCount?: number;
}) {
  const [supported, setSupported] = useState(true);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rateIdx, setRateIdx] = useState(2); // 1x
  const [wordIdx, setWordIdx] = useState(0);
  const [totalWords, setTotalWords] = useState(initialWordCount);
  const [dragging, setDragging] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [playQueued, setPlayQueued] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

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

  const wordsRef = useRef<NarrationWord[]>([]);
  const chunksRef = useRef<Chunk[]>([]);
  const wordLocationsRef = useRef<WeakMap<Text, NodeWordLocation[]>>(
    new WeakMap()
  );
  const highlightRuntimeRef = useRef<HighlightRuntime | null>(null);
  const fallbackSpansRef = useRef(false);
  const proseRef = useRef<HTMLElement | null>(null);
  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const readyRef = useRef(false);
  const queuedPlayRef = useRef(false);
  const beginPreparationRef = useRef<(urgent: boolean) => void>(
    () => undefined
  );
  const playRef = useRef<() => void>(() => undefined);
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
  // Playhead and waveform bars: written to directly through setProgressUI
  // (below) rather than through React state/JSX style bindings. The playhead
  // moves as one compositor-rasterized layer; changing `left` on every frame
  // makes the browser repaint each rounded edge at a different subpixel
  // coverage, which on a 3px-wide bar shows up as the edge shimmering as it
  // travels.
  const dotPositionRef = useRef<HTMLSpanElement>(null);
  const barsRef = useRef<(SVGLineElement | null)[]>([]);
  const lastPlayedCountRef = useRef(-1);
  // Incremented on every (re)start; stale utterance callbacks and pending
  // start-polls compare against it and bail, so rapid seeks can't race.
  const genRef = useRef(0);
  const invalidateSpeechGeneration = useCallback(() => {
    // Teardown must invalidate the latest generation, not the value that was
    // current when the setup effect ran: playback can restart while that
    // effect remains mounted.
    genRef.current++;
  }, []);
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
  const dragRafRef = useRef<number | null>(null);
  const dragCleanupRef = useRef<() => void>(() => undefined);
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
      // Keep the playhead's raster intact and translate that layer as a unit.
      // Width is cached by the ResizeObserver below, so playback's rAF loop
      // does not force layout on every frame. The -50% pair is self-relative,
      // so it keeps centring correctly whatever the playhead's own size is.
      const x = clamped * visualTrackWidthRef.current;
      dotPositionRef.current.style.transform = `translate3d(${x}px, -50%, 0) translateX(-50%)`;
    }

    // Compare the playhead and bars in the SVG's own coordinate system. Bars
    // are inset from the 0–640 track edges, so an index-based percentage makes
    // them flip before or after the playhead actually crosses them.
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

  // ---- deferred, chunked narration preparation ----
  // Modern browsers keep the article DOM untouched and index words as Ranges
  // for the CSS Custom Highlight API. Old browsers get the incumbent span
  // behavior, but only here, after load/idle, in bounded DOM batches.
  useEffect(() => {
    const prose = document.getElementById(articleId);
    if (!prose) return;
    proseRef.current = prose;
    const abortController = new AbortController();
    const { signal } = abortController;
    const speechSupported = "speechSynthesis" in window;
    if (!speechSupported) {
      setSupported(false);
      return;
    }
    const highlightSupport = getHighlightSupport();
    const idleScheduler = getIdleScheduler();
    fallbackSpansRef.current = !highlightSupport;
    let preparationStarted = false;
    let priorityRequested = queuedPlayRef.current;
    let idleId: number | null = null;
    let launchTimer: number | null = null;
    let autoPlayTimer: number | null = null;
    let removeHighlightStyles: () => void = () => undefined;

    const findBlock = (node: Text) => {
      let block = node.parentElement;
      while (block && block !== prose && !BLOCK_TAGS.has(block.tagName)) {
        block = block.parentElement;
      }
      return block || prose;
    };

    const makeWalker = () =>
      document.createTreeWalker(prose, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          let el = node.parentElement;
          while (el && el !== prose) {
            if (
              SKIP_TAGS.has(el.tagName) ||
              el.hasAttribute("data-no-narrate")
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            el = el.parentElement;
          }
          return /\S/.test(node.nodeValue || "")
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      });

    const loadNarrationData = async (): Promise<NarrationData | null> => {
      if (!slug) return null;
      try {
        const res = await fetch(`/narration/${year}/${slug}.json`, { signal });
        if (!res.ok) return null;
        const data = (await res.json()) as NarrationData;
        if (
          !data?.audio ||
          !Array.isArray(data.words) ||
          data.words.length === 0 ||
          data.words.length !== data.starts?.length
        ) {
          return null;
        }
        return data;
      } catch (error) {
        if (signal.aborted) throw error;
        // Missing or malformed timing data preserves the Web Speech fallback.
        return null;
      }
    };

    const prepareRangeWords = async (
      words: NarrationWord[],
      domNorm: string[],
      unread: HighlightSetLike
    ) => {
      const locations = new WeakMap<Text, NodeWordLocation[]>();
      const walker = makeWalker();
      let sliceStarted = performance.now();
      let nodeCount = 0;

      while (walker.nextNode()) {
        abortIfNeeded(signal);
        const node = walker.currentNode as Text;
        const block = findBlock(node);
        const nodeLocations: NodeWordLocation[] = [];
        const matcher = /\S+/g;
        let match: RegExpExecArray | null;
        while ((match = matcher.exec(node.data))) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const index = words.length;
          words.push({
            block,
            el: null,
            range,
            text: match[0],
          });
          domNorm.push(normWord(match[0]));
          nodeLocations.push({
            endOffset: match.index + match[0].length,
            index,
            startOffset: match.index,
          });
          unread.add(range);

          if (
            words.length % PREPARATION_WORD_BATCH === 0 &&
            performance.now() - sliceStarted >= PREPARATION_SLICE_MS
          ) {
            await yieldPreparationTurn(signal, priorityRequested);
            abortIfNeeded(signal);
            sliceStarted = performance.now();
          }
        }
        locations.set(node, nodeLocations);
        nodeCount++;
        if (
          nodeCount % 24 === 0 &&
          performance.now() - sliceStarted >= PREPARATION_SLICE_MS
        ) {
          await yieldPreparationTurn(signal, priorityRequested);
          abortIfNeeded(signal);
          sliceStarted = performance.now();
        }
      }
      wordLocationsRef.current = locations;
    };

    const prepareFallbackWords = async (
      words: NarrationWord[],
      domNorm: string[]
    ) => {
      const walker = makeWalker();
      const textNodes: Text[] = [];
      let sliceStarted = performance.now();
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode as Text);
        if (
          textNodes.length % 48 === 0 &&
          performance.now() - sliceStarted >= PREPARATION_SLICE_MS
        ) {
          await yieldPreparationTurn(signal, priorityRequested);
          abortIfNeeded(signal);
          sliceStarted = performance.now();
        }
      }

      for (const node of textNodes) {
        abortIfNeeded(signal);
        const block = findBlock(node);
        const originalText = node.data;
        const matcher = /\s+|\S+/g;
        let remainingNode: Text | null = node;
        let fragment = document.createDocumentFragment();
        let fragmentLength = 0;
        let fragmentWords = 0;
        let match: RegExpExecArray | null;

        const commitFragment = () => {
          if (!remainingNode || fragmentLength === 0) return;
          const tail =
            fragmentLength < remainingNode.data.length
              ? remainingNode.splitText(fragmentLength)
              : null;
          remainingNode.parentNode?.replaceChild(fragment, remainingNode);
          remainingNode = tail;
          fragment = document.createDocumentFragment();
          fragmentLength = 0;
          fragmentWords = 0;
        };

        while ((match = matcher.exec(originalText))) {
          const token = match[0];
          fragmentLength += token.length;
          if (/^\s+$/.test(token)) {
            fragment.appendChild(document.createTextNode(token));
          } else {
            const span = document.createElement("span");
            span.className = "nw";
            span.dataset.nwi = String(words.length);
            span.textContent = token;
            fragment.appendChild(span);
            words.push({
              block,
              el: span,
              range: null,
              text: token,
            });
            domNorm.push(normWord(token));
            fragmentWords++;
          }

          if (fragmentWords >= FALLBACK_DOM_WORD_BATCH) {
            commitFragment();
            await yieldPreparationTurn(signal, priorityRequested);
            abortIfNeeded(signal);
          }
        }
        commitFragment();
        if (performance.now() - sliceStarted >= PREPARATION_SLICE_MS) {
          await yieldPreparationTurn(signal, priorityRequested);
          abortIfNeeded(signal);
          sliceStarted = performance.now();
        }
      }
    };

    const prepare = async () => {
      try {
        // Even a user-prioritized preparation begins in a fresh task, so the
        // first Play interaction never inherits article indexing work.
        await yieldPreparationTurn(signal, priorityRequested);
        const timingPromise = loadNarrationData();
        const words: NarrationWord[] = [];
        const domNorm: string[] = [];
        let runtime: HighlightRuntime | null = null;

        if (highlightSupport) {
          const read = new highlightSupport.HighlightCtor();
          const current = new highlightSupport.HighlightCtor();
          const unread = new highlightSupport.HighlightCtor();
          runtime = {
            current,
            index: -1,
            read,
            registry: highlightSupport.registry,
            unread,
          };
          await prepareRangeWords(words, domNorm, unread);
        } else {
          await prepareFallbackWords(words, domNorm);
        }
        abortIfNeeded(signal);

        // Group adjacent words by semantic block for reliable Web Speech
        // utterances, yielding across long articles.
        const chunks: Chunk[] = [];
        let i = 0;
        let sliceStarted = performance.now();
        while (i < words.length) {
          const j0 = i;
          const parts: string[] = [];
          const offsets: number[] = [];
          let len = 0;
          while (i < words.length && words[i].block === words[j0].block) {
            offsets.push(len);
            parts.push(words[i].text);
            len += words[i].text.length + 1;
            i++;
          }
          chunks.push({ start: j0, end: i, text: parts.join(" "), offsets });
          if (performance.now() - sliceStarted >= PREPARATION_SLICE_MS) {
            await yieldPreparationTurn(signal, priorityRequested);
            abortIfNeeded(signal);
            sliceStarted = performance.now();
          }
        }

        const data = await timingPromise;
        abortIfNeeded(signal);
        wordsRef.current = words;
        chunksRef.current = chunks;
        highlightRuntimeRef.current = runtime;
        if (runtime) {
          removeHighlightStyles = installHighlightStyles(articleId);
          runtime.registry.set(NARRATION_READ_HIGHLIGHT, runtime.read);
          runtime.registry.set(NARRATION_CURRENT_HIGHLIGHT, runtime.current);
          runtime.registry.set(NARRATION_UNREAD_HIGHLIGHT, runtime.unread);
        }

        if (data) {
          const alignedStarts = await alignTimings(
            domNorm,
            data.words,
            data.starts,
            data.durationMs,
            signal,
            () => priorityRequested
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
        }

        const hasWords = words.length > 0;
        setTotalWords(words.length);
        readyRef.current = hasWords;
        setReady(hasWords);
        if (!hasWords) {
          queuedPlayRef.current = false;
          setPlayQueued(false);
          setSupported(false);
          return;
        }

        if (queuedPlayRef.current) {
          queuedPlayRef.current = false;
          setPlayQueued(false);
          autoPlayTimer = window.setTimeout(() => playRef.current(), 0);
        }
      } catch {
        if (!signal.aborted) setSupported(false);
      }
    };

    const launchPreparation = () => {
      if (preparationStarted || signal.aborted) return;
      preparationStarted = true;
      if (idleId !== null) {
        idleScheduler.cancel?.(idleId);
        idleId = null;
      }
      launchTimer = window.setTimeout(() => {
        launchTimer = null;
        void prepare();
      }, 0);
    };

    const scheduleAfterLoad = () => {
      if (priorityRequested) {
        launchPreparation();
        return;
      }
      if (idleScheduler.request) {
        idleId = idleScheduler.request(launchPreparation, { timeout: 1500 });
      } else {
        launchTimer = window.setTimeout(launchPreparation, 16);
      }
    };

    const onLoad = () => scheduleAfterLoad();
    if (document.readyState === "complete") scheduleAfterLoad();
    else window.addEventListener("load", onLoad, { once: true });

    beginPreparationRef.current = (urgent: boolean) => {
      if (!urgent) return;
      priorityRequested = true;
      if (preparationStarted) return;
      if (idleId !== null) {
        idleScheduler.cancel?.(idleId);
        idleId = null;
      }
      // Timing metadata stays behind the load/LCP boundary even for an early
      // click. Once load has fired, the request skips the idle wait.
      if (document.readyState === "complete") launchPreparation();
    };

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
      window.removeEventListener("load", onLoad);
      cancelIdleReturn();
      abortController.abort();
      invalidateSpeechGeneration();
      playingRef.current = false;
      pausedRef.current = false;
      readyRef.current = false;
      beginPreparationRef.current = () => undefined;
      if (idleId !== null) idleScheduler.cancel?.(idleId);
      if (launchTimer !== null) window.clearTimeout(launchTimer);
      if (autoPlayTimer !== null) window.clearTimeout(autoPlayTimer);
      highlightSupport?.registry.delete(NARRATION_READ_HIGHLIGHT);
      highlightSupport?.registry.delete(NARRATION_CURRENT_HIGHLIGHT);
      highlightSupport?.registry.delete(NARRATION_UNREAD_HIGHLIGHT);
      removeHighlightStyles();
      if (speechSupported) window.speechSynthesis.cancel();
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
    };
  }, [articleId, invalidateSpeechGeneration, slug, year]);

  // Unmount: stop the audio pipeline (speech teardown lives in the setup effect).
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
      dragCleanupRef.current();
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.pause();
      }
      audioRef.current = null;
    },
    []
  );

  // ---- highlight helpers (direct DOM, no per-word re-render) ----
  const syncRangeReadState = useCallback((idx: number) => {
    const words = wordsRef.current;
    const runtime = highlightRuntimeRef.current;
    if (!runtime || !words[idx]?.range) return;
    const prev = runtime.index;
    if (prev === idx) return;

    const move = (
      wordIdx: number,
      from: HighlightSetLike,
      to: HighlightSetLike
    ) => {
      const range = words[wordIdx]?.range;
      if (!range) return;
      from.delete(range);
      to.add(range);
    };

    if (prev < 0) {
      for (let i = 0; i < idx; i++) move(i, runtime.unread, runtime.read);
      move(idx, runtime.unread, runtime.current);
    } else if (idx > prev) {
      move(prev, runtime.current, runtime.read);
      for (let i = prev + 1; i < idx; i++) {
        move(i, runtime.unread, runtime.read);
      }
      move(idx, runtime.unread, runtime.current);
    } else {
      move(prev, runtime.current, runtime.unread);
      for (let i = prev - 1; i > idx; i--) {
        move(i, runtime.read, runtime.unread);
      }
      move(idx, runtime.read, runtime.current);
    }
    runtime.index = idx;
  }, []);

  const applyReadState = useCallback(
    (idx: number) => {
      if (!fallbackSpansRef.current) {
        syncRangeReadState(idx);
        return;
      }
      const words = wordsRef.current;
      for (let i = 0; i < words.length; i++) {
        words[i].el?.classList.toggle("nw-read", i < idx);
        words[i].el?.classList.toggle("nw-current", i === idx);
      }
    },
    [syncRangeReadState]
  );

  const setCurrentWord = useCallback(
    (idx: number) => {
      const words = wordsRef.current;
      const prev = wordIdxRef.current;
      const cur = words[idx];
      if (!cur) return;

      if (fallbackSpansRef.current) {
        words[prev]?.el?.classList.remove("nw-current");
        if (idx > prev) words[prev]?.el?.classList.add("nw-read");
        // Non-sequential jump (seek): recompute all read flags.
        if (idx !== prev + 1 && idx !== prev) applyReadState(idx);
      } else {
        syncRangeReadState(idx);
      }

      // Ink-fill sweep duration: base ms-per-word at the current rate, scaled
      // by word length so long words fill slower than short ones.
      if (cur.el) {
        const baseMs = 60000 / (BASE_WPM * rateRef.current);
        const lenScale = Math.min(2, Math.max(0.6, cur.text.length / 5));
        cur.el.style.setProperty(
          "--wdur",
          `${Math.round(baseMs * lenScale)}ms`
        );
        cur.el.classList.add("nw-current");
      }
      // Auto-scroll: keep the current word in a comfortable band, unless the
      // reader scrolled themselves in the last few seconds.
      if (
        !viewportOverrideRef.current &&
        Date.now() - lastUserScrollRef.current > 4000
      ) {
        const r =
          cur.range?.getBoundingClientRect() ?? cur.el?.getBoundingClientRect();
        if (r) {
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
    },
    [applyReadState, syncRangeReadState]
  );

  const clearHighlights = useCallback(() => {
    proseRef.current?.classList.remove("narrating");
    if (fallbackSpansRef.current) {
      for (const w of wordsRef.current) {
        w.el?.classList.remove("nw-read", "nw-current");
      }
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
    // Reset the Range partitions outside a user interaction so replay never
    // pays an O(article) rewind cost in the next Play task.
    applyReadState(0);
  }, [clearHighlights, applyReadState]);

  const startFrom = useCallback(
    (idx: number, alreadyStopped = false) => {
      const chunks = chunksRef.current;
      let lo = 0;
      let hi = chunks.length - 1;
      let ci = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const chunk = chunks[mid];
        if (idx < chunk.start) hi = mid - 1;
        else if (idx >= chunk.end) lo = mid + 1;
        else {
          ci = mid;
          break;
        }
      }
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
            let offsetLo = localStart;
            let offsetHi = chunk.offsets.length - 1;
            let w = localStart;
            while (offsetLo <= offsetHi) {
              const mid = (offsetLo + offsetHi) >> 1;
              if (chunk.offsets[mid] <= absChar) {
                w = mid;
                offsetLo = mid + 1;
              } else {
                offsetHi = mid - 1;
              }
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
    applyReadState(0);
    setCurMs(0);
    audioPositionMsRef.current = 0;
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, [clearHighlights, applyReadState]);

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

  useEffect(() => {
    playRef.current = play;
    return () => {
      playRef.current = () => undefined;
    };
  }, [play]);

  const onPrimaryAction = useCallback(() => {
    if (!readyRef.current) {
      if (!supported) return;
      queuedPlayRef.current = true;
      setPlayQueued(true);
      beginPreparationRef.current(true);
      return;
    }
    if (playingRef.current) pause();
    else play();
  }, [pause, play, supported]);

  const restart = useCallback(() => {
    if (modeRef.current === "audio") {
      audioPlay(0);
      return;
    }
    startFrom(0);
  }, [startFrom, audioPlay]);

  const wordIndexFromPoint = useCallback((clientX: number, clientY: number) => {
    const doc = document as Document & {
      caretPositionFromPoint?: (
        x: number,
        y: number
      ) => { offset: number; offsetNode: Node } | null;
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
    };
    const position = doc.caretPositionFromPoint?.(clientX, clientY);
    const legacyRange = position
      ? null
      : doc.caretRangeFromPoint?.(clientX, clientY);
    const node = position?.offsetNode ?? legacyRange?.startContainer;
    const offset = position?.offset ?? legacyRange?.startOffset;
    if (!(node instanceof Text) || offset === undefined) return -1;
    const locations = wordLocationsRef.current.get(node);
    if (!locations) return -1;

    let lo = 0;
    let hi = locations.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const word = locations[mid];
      if (offset < word.startOffset) hi = mid - 1;
      else if (offset >= word.endOffset) lo = mid + 1;
      else return word.index;
    }
    return -1;
  }, []);

  // While narrating, clicking any word jumps playback there. Capture phase +
  // preventDefault so words inside links jump instead of navigating. Modern
  // browsers resolve the clicked caret into the Range index without word DOM.
  useEffect(() => {
    if (!ready) return;
    const prose = proseRef.current;
    if (!prose) return;
    const onClick = (e: MouseEvent) => {
      if (!playingRef.current) return;
      let idx = -1;
      if (fallbackSpansRef.current) {
        const el = (e.target as HTMLElement).closest?.(
          ".nw"
        ) as HTMLElement | null;
        if (el?.dataset.nwi) idx = parseInt(el.dataset.nwi, 10);
      } else {
        idx = wordIndexFromPoint(e.clientX, e.clientY);
      }
      if (idx < 0) return;
      e.preventDefault();
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
  }, [ready, startFrom, audioPlay, wordIndexFromPoint]);

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

  const onTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const trackRect = trackRef.current?.getBoundingClientRect();
      if (!trackRect?.width) return;
      dragCleanupRef.current();
      const fractionAt = (clientX: number) =>
        Math.min(1, Math.max(0, (clientX - trackRect.left) / trackRect.width));
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
      let pendingClientX = e.clientX;
      const renderDragFrame = () => {
        dragRafRef.current = null;
        const frac = fractionAt(pendingClientX);
        setProgressUI(frac);
        if (modeRef.current === "audio") {
          const ms = frac * durationMsRef.current;
          const idx = wordIdxForMs(ms);
          setCurMs(ms);
          audioPositionMsRef.current = ms;
          if (wordIdxRef.current !== idx) {
            wordIdxRef.current = idx;
            setWordIdx(idx);
          }
          return;
        }
        const total = wordsRef.current.length;
        const idx = Math.min(
          total - 1,
          Math.max(0, Math.round(frac * (total - 1)))
        );
        if (wordIdxRef.current !== idx) {
          wordIdxRef.current = idx;
          setWordIdx(idx);
        }
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
        seekToFraction(fractionAt(pendingClientX), wasPlaying, true);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
      dragCleanupRef.current = cleanupDrag;
      move(e.nativeEvent);
    },
    [stop, seekToFraction, wordIdxForMs, setProgressUI]
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
    // Re-run at readiness so direct DOM visuals reflect any prepared timing
    // position even when the numeric progress happened to remain unchanged.
  }, [progress, setProgressUI, ready]);

  if (!supported) return null;

  return (
    <div
      aria-busy={!ready}
      data-narration-state={ready ? "ready" : "loading"}
      className="blog-narrator border-border bg-secondary/15 mb-6 rounded-md border p-2.5 sm:p-3"
    >
      <span className="sr-only" role="status" aria-live="polite">
        {ready
          ? "Narration ready."
          : playQueued
            ? "Preparing narration. Playback will start automatically."
            : "Preparing narration."}
      </span>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onPrimaryAction}
          aria-label={
            ready
              ? playing
                ? "Pause narration"
                : "Play narration"
              : playQueued
                ? "Narration is preparing and will play automatically"
                : "Play narration when ready"
          }
          // Full strength, not the /80 it used to sit at. This is the primary
          // control in the component; dimming it at rest put it below the
          // played waveform beside it in the visual order. Hover feedback
          // comes from the background wash and the active press, which is
          // enough without also holding the icon back.
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
            // visible text: a bare "Narration speed" label overrode the "1x"
            // on screen, so a voice-control user saying the label they can see
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
