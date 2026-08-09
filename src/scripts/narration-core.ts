/**
 * The framework-free half of the blog narrator.
 *
 * Constants, types, and the timing alignment — none of it ever touched React,
 * so it is lifted out unchanged ahead of the island's rewrite. The vanilla
 * player will import exactly this; extracting it first means the rewrite is
 * only the DOM and UI layer, and that this half can be tested on its own.
 */

export const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
// Rough speaking pace of Web Speech voices at 1x, used only for the time labels.
export const BASE_WPM = 170;
export const WAVEFORM_VIEWBOX_WIDTH = 640;
export const WAVEFORM_EDGE_INSET = 5;
export const WAVEFORM_BAR_SPAN = WAVEFORM_VIEWBOX_WIDTH - WAVEFORM_EDGE_INSET * 2;
export const BAR_COUNT = 64;
export const VIEWPORT_RETURN_IDLE_MS = 6000;

// Chrome/Windows can clip the beginning of speech while its native TTS backend
// is recovering from cancel(). A real, silent utterance is used as a
// sacrificial queue head; its onstart event is the only useful signal the API
// exposes that the new queue has reached the speech engine. Keep this text
// non-empty: empty/whitespace-only utterances have their own Chromium bugs.
export const RESTART_PRIMER_TEXT = "ready";
export const RESTART_PRIMER_RATE = 2;
export const PRIMER_START_TIMEOUT_MS = 1200;

// The primer protects cancel -> speak. This short, unspoken punctuation lead-in
// also gives every later chunk a few generated silence frames, so a voice that
// clips the beginning of each native utterance clips the pause, not the word.
export const CHUNK_LEAD_IN = "… ";

export interface WordSpan {
  el: HTMLSpanElement;
  text: string;
}

// A chunk is one utterance: a contiguous run of words inside a single block
// element (paragraph, heading, list item). Keeping utterances block-sized
// avoids the Chrome bug where long utterances silently die mid-speech.
export interface Chunk {
  start: number; // index into words[]
  end: number; // exclusive
  text: string;
  // Character offset of each word inside `text`, for onboundary mapping.
  offsets: number[];
}

export const SKIP_TAGS = new Set([
  "PRE",
  "CODE",
  "TABLE",
  "IMG",
  "FIGURE",
  "FIGCAPTION",
  "SCRIPT",
  "STYLE",
]);

export const BLOCK_TAGS = new Set([
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

export function formatTime(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ---- pre-generated narration (Edge TTS) timings ----
// scripts/generate-narrations.mjs produces /narration/<year>/<slug>.json: the audio
// URL plus a start time for every spoken word. Those words come from the
// markdown source while ours come from the rendered DOM, so the two lists can
// disagree in small ways (tokenization, expanded numbers, skipped islands).
// alignTimings maps them tolerantly instead of assuming 1:1.

export interface NarrationData {
  v: number;
  audio: string;
  durationMs: number;
  words: string[];
  starts: number[];
}

export const normWord = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

// Returns a start time (ms) for every DOM word. Two-pointer walk: a TTS token
// may cover part of a DOM word (hyphenated words split by the service), several
// DOM words (merged tokens), or neither (spoken expansions like "2026" ->
// "twenty twenty-six" are dropped; unmatched DOM words are interpolated).
export function alignTimings(
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
