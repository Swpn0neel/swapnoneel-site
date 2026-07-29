"use client";

import {
  BALL_R,
  BreakoutEngine,
  buildWall,
  LIVES,
  PADDLE_BOTTOM,
  PADDLE_H,
  PADDLE_W,
  type Brick,
  type Stats,
} from "@/lib/breakout-engine";
import { i18n } from "@/lib/i18n";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The 404 headline, which can be knocked down.
 *
 * Idle it is ordinary text — server-rendered, real, selectable, and identical
 * to what the page would show if this component never hydrated. Only on a
 * deliberate press does it become a Breakout wall.
 *
 * The wall is measured from the headline but not traced from it: the <p>'s own
 * box gives the rectangle, and the digit matrix in lib/breakout-engine.ts fills
 * it. Tracing Inter's outlines directly was the first attempt and it looked
 * wrong at every resolution short enough to keep the game playable — see the
 * note on GLYPHS. So the bricks take over the exact footprint the type had,
 * with letterforms drawn for the grid rather than crushed onto it.
 *
 * Physics lives in lib/breakout-engine.ts, which knows nothing about React or
 * the DOM. This file owns layout, input, painting and the HUD.
 */

/** Space opened up below the headline to play in, in CSS pixels. */
const FIELD = 168;
/** Share of the assembly spent staggering rather than easing. Higher sweeps
 *  harder across the wall; lower makes it closer to a single pop. */
const STAGGER = 0.55;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function FourOhFourBreakout() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BreakoutEngine | null>(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  const [stats, setStats] = useState<Stats>({
    phase: "idle",
    bricks: 0,
    lives: LIVES,
  });
  // Height animates from "just the headline" to "headline plus a field", so the
  // page only makes room once someone has chosen to play. The shift is
  // input-driven, which is both good manners and outside the CLS window.
  const [height, setHeight] = useState<number | null>(null);
  /** The headline's own height, which the wrapper returns to once the game
   *  ends. Tracked separately because `height` follows the canvas, which stays
   *  at full field size while it fades out. */
  const [textH, setTextH] = useState<number | null>(null);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    const engine = engineRef.current;
    if (!cv || !engine) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    // Colour comes from the canvas's own computed `color`, so everything tracks
    // the theme through the same token the headline uses.
    const ink = getComputedStyle(cv).color;
    ctx.clearRect(0, 0, engine.w, engine.h);
    ctx.fillStyle = ink;

    // Bricks. During assembly each one is held back by its place in the sweep,
    // then eases up to full size — the wall builds instead of blinking on.
    const p = engine.reveal;
    for (const b of engine.bricks) {
      if (!b.alive) continue;
      let alpha = 1;
      let scale = 1;
      if (p < 1) {
        const t = (p - b.seq * STAGGER) / (1 - STAGGER);
        if (t <= 0) continue;
        const e = easeOut(Math.min(1, t));
        alpha = e;
        scale = 0.55 + 0.45 * e;
      }
      ctx.globalAlpha = alpha;
      // A hairline gap keeps the wall reading as masonry rather than a blob.
      const iw = (b.w - 1) * scale;
      const ih = (b.h - 1) * scale;
      ctx.fillRect(
        b.x + 0.5 + (b.w - 1 - iw) / 2,
        b.y + 0.5 + (b.h - 1 - ih) / 2,
        iw,
        ih
      );
    }

    // Struck bricks dim out roughly in place. This fires dozens of times a
    // game, so it stays a soft afterimage — a bigger bloom read as noise and
    // made the wall look like it was exploding rather than eroding.
    for (const d of engine.debris) {
      const grow = 1 + (1 - d.life) * 0.1;
      const dw = (d.w - 1) * grow;
      const dh = (d.h - 1) * grow;
      ctx.globalAlpha = d.life * 0.25;
      ctx.fillRect(
        d.x + 0.5 + (d.w - 1 - dw) / 2,
        d.y + 0.5 + (d.h - 1 - dh) / 2,
        dw,
        dh
      );
    }

    // Trail first, so the ball always sits on top of its own history.
    for (let i = 0; i < engine.trail.length; i++) {
      const t = (i + 1) / (engine.trail.length + 1);
      ctx.globalAlpha = t * 0.22;
      ctx.beginPath();
      ctx.arc(engine.trail[i].x, engine.trail[i].y, BALL_R * t, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ball and paddle fade out once the game is over rather than blinking out
    // of existence the frame the last life goes.
    const leaving = 1 - engine.endFade;
    if (leaving <= 0) {
      ctx.globalAlpha = 1;
      return;
    }

    // The paddle widens and thins on contact — a bounce you feel rather than
    // one you notice.
    const s = engine.squash;
    const pw = PADDLE_W * (1 + s * 0.07);
    const ph = PADDLE_H * (1 - s * 0.22);
    ctx.globalAlpha = leaving;
    ctx.beginPath();
    ctx.roundRect(
      engine.paddleX - (pw - PADDLE_W) / 2,
      engine.h - PADDLE_BOTTOM + (PADDLE_H - ph) / 2,
      pw,
      ph,
      3.5
    );
    ctx.fill();

    // The ball rides in on the paddle's glide home, so a fresh life arrives
    // with it instead of appearing from nothing.
    ctx.globalAlpha = leaving * easeOut(engine.settle);
    ctx.beginPath();
    ctx.arc(engine.ball.x, engine.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }, []);

  /** Sets the backing store to device pixels while the drawing code stays in
   *  CSS pixels, so the wall is crisp on a retina screen. */
  const applySize = useCallback((w: number, h: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.height = `${h}px`;
    cv.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    engineRef.current?.resize(w, h);
    setHeight(h);
  }, []);

  /**
   * Measures the box the real headline occupies and lays the wall into exactly
   * that rectangle, so the bricks take over the footprint the type just had.
   */
  const wallFromHeadline = useCallback((w: number): Brick[] => {
    const textEl = textRef.current;
    const wrapEl = wrapRef.current;
    if (!textEl || !wrapEl) return [];

    const cs = getComputedStyle(textEl);
    const fontPx = parseFloat(cs.fontSize);

    const probe = document.createElement("canvas").getContext("2d");
    if (!probe) return [];
    probe.font = `${cs.fontWeight} ${fontPx}px ${cs.fontFamily}`;
    probe.textAlign = "center";
    probe.textBaseline = "alphabetic";

    const m = probe.measureText("404");
    const tRect = textEl.getBoundingClientRect();
    const wRect = wrapEl.getBoundingClientRect();

    // Where the browser actually put the baseline, per the CSS inline box
    // model: the content area is the font's own ascent+descent, centred in the
    // line box, and the baseline sits an ascent below that. Deriving it from
    // the *ink* ascent instead — which is what this used to do — lands the wall
    // a few pixels off, because ink height and font height are not the same
    // number. That was the jump when the headline became bricks.
    const lineH = parseFloat(cs.lineHeight) || fontPx;
    const fontAsc = m.fontBoundingBoxAscent || fontPx * 0.9;
    const fontDesc = m.fontBoundingBoxDescent || fontPx * 0.22;
    const halfLeading = (lineH - (fontAsc + fontDesc)) / 2;
    const baseline = tRect.top - wRect.top + halfLeading + fontAsc;

    // The box is the glyphs' own ink extents around that baseline, so the wall
    // covers exactly what the type covered — no wider, no taller.
    const cx = w / 2;
    return buildWall({
      left: cx - m.actualBoundingBoxLeft,
      right: cx + m.actualBoundingBoxRight,
      top: baseline - (m.actualBoundingBoxAscent || fontPx * 0.72),
      bottom: baseline + (m.actualBoundingBoxDescent || 0),
    });
  }, []);

  // The frame loop is self-referential, so it lives here rather than in a
  // useCallback that would have to close over itself. `startRef` is the handle
  // the buttons pull.
  const startRef = useRef<() => void>(() => {});

  useEffect(() => {
    const wrap = wrapRef.current;
    const text = textRef.current;
    if (!wrap || !text) return;

    const engine = new BreakoutEngine(setStats);
    engineRef.current = engine;
    setTextH(text.offsetHeight);
    applySize(wrap.clientWidth, text.offsetHeight);

    // The CSS side is handled by motion-safe:, but the canvas effects are
    // hand-rolled, so the engine has to be told directly.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      engine.reduced = mq.matches;
      if (mq.matches) {
        engine.reveal = 1;
        engine.debris = [];
        engine.trail = [];
      }
    };
    syncMotion();
    mq.addEventListener("change", syncMotion);

    const frame = (now: number) => {
      rafRef.current = requestAnimationFrame(frame);
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      engine.tick(dt);
      draw();
    };

    startRef.current = () => {
      // Measuring before the face resolves would size the wall to the fallback's
      // metrics, not Inter's, and the bricks would miss the headline's box.
      const begin = () => {
        const w = wrap.clientWidth;
        setTextH(text.offsetHeight);
        applySize(w, text.offsetHeight + FIELD);
        engine.setWall(wallFromHeadline(w));
        engine.start();
        // Paint once up front. The text has already crossfaded to nothing by
        // this point, so if the first animation frame is late — a backgrounded
        // tab, a throttled renderer — the headline would otherwise just vanish.
        draw();
        lastRef.current = performance.now();
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(frame);
        canvasRef.current?.focus({ preventScroll: true });
      };
      if (document.fonts?.ready) void document.fonts.ready.then(begin);
      else begin();
    };

    const ro = new ResizeObserver(() => {
      // The canvas keeps its full field size for as long as it is on screen,
      // including while it fades out after the game; only the wrapper shrinks.
      const onScreen = engine.phase !== "idle";
      const w = wrap.clientWidth;
      setTextH(text.offsetHeight);
      applySize(w, text.offsetHeight + (onScreen ? FIELD : 0));
      // A resize invalidates every brick coordinate, so the wall is rebuilt
      // from the newly laid-out text rather than stretched.
      if (onScreen) {
        engine.setWall(wallFromHeadline(w));
        // No glide here: the field itself moved, so there is no previous
        // position worth travelling from.
        engine.resetBall(false);
      }
      draw();
    });
    // The wrapper is capped at 460px, so its width stops changing well before
    // the viewport does — but the headline is sized in vw and keeps scaling.
    // Watching the text too is what catches that.
    ro.observe(wrap);
    ro.observe(text);

    return () => {
      ro.disconnect();
      mq.removeEventListener("change", syncMotion);
      cancelAnimationFrame(rafRef.current);
      engineRef.current = null;
    };
  }, [applySize, draw, wallFromHeadline]);

  const { phase, bricks, lives } = stats;
  const playing = phase === "playing";
  const over = phase === "won" || phase === "lost";

  const move = (clientX: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    engineRef.current?.movePaddleTo(clientX - cv.getBoundingClientRect().left);
  };

  const nudge = (dx: number) => {
    engineRef.current?.nudge(dx);
  };

  // Both outcomes hand the page back: the field closes, the bricks fade out and
  // the real headline fades in behind them. Winning used to collapse the space
  // to nothing, which left the page with a hole where the 404 had been.
  const displayHeight = playing ? height : textH;

  return (
    <div className="flex flex-col items-center">
      <div
        ref={wrapRef}
        className="relative mx-auto w-full max-w-[460px] overflow-hidden motion-safe:transition-[height] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ height: displayHeight ?? undefined }}
      >
        <p
          ref={textRef}
          aria-hidden={playing}
          className="text-muted-foreground pointer-events-none absolute inset-x-0 top-0 m-0 text-center text-[clamp(4rem,34vw,10rem)] leading-none font-bold transition-opacity duration-300"
          style={{ opacity: playing ? 0 : 1 }}
        >
          404
        </p>

        <canvas
          ref={canvasRef}
          tabIndex={playing ? 0 : -1}
          role="img"
          // Invisible between games, so it should be out of the tree too rather
          // than announcing a wall that is not there.
          aria-hidden={!playing}
          aria-label={i18n.notFound.game.canvasLabel}
          className="text-muted-foreground focus-visible:ring-ring absolute inset-x-0 top-0 block w-full rounded-sm transition-opacity duration-300 focus-visible:ring-1 focus-visible:outline-none"
          style={{
            // Crossfades with the headline: the bricks go as the real 404
            // comes back, while the field closes underneath them.
            opacity: playing ? 1 : 0,
            // Only swallow touch scrolling while the game is actually running.
            touchAction: playing ? "none" : "auto",
            cursor: playing ? "none" : "default",
          }}
          onPointerDown={(e) => {
            if (!playing) return;
            move(e.clientX);
            engineRef.current?.launch();
          }}
          onPointerMove={(e) => {
            if (!playing) return;
            move(e.clientX);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              nudge(-28);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              nudge(28);
            } else if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              if (playing) engineRef.current?.launch();
              else startRef.current();
            }
          }}
        />
      </div>

      {/* Sized for the tallest state — every state is two centred lines — so
          nothing below moves as the game changes. `min-h` rather than `h`
          because a fixed height would clip instead of grow if a reader's font
          scale pushed the result onto a second line; at default sizes the
          longest message needs 219px of the 288px a 320px phone offers, so it
          never comes up in practice. */}
      <div className="mt-5 flex min-h-11 flex-col items-center justify-center">
        {phase === "idle" && (
          <button
            type="button"
            onClick={() => startRef.current()}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring cursor-pointer rounded-sm font-mono text-[11px] tracking-wide underline-offset-4 transition-colors hover:underline focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {i18n.notFound.game.idle}
          </button>
        )}

        {playing && (
          <div className="text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 flex flex-col items-center gap-1.5 font-mono text-[11px] tracking-wide duration-300">

            {/* State on top: what it is costing and how much is left. Lives
                read faster as marks than as a number, and three is small enough
                that precision costs nothing. */}
            <span className="flex items-center gap-2.5">
              <span
                className="flex items-center gap-1"
                role="img"
                aria-label={i18n.notFound.game.livesLabel(lives)}
              >
                {Array.from({ length: LIVES }, (_, i) => (
                  <span
                    key={i}
                    className={`size-1.5 rounded-full transition-all duration-300 ${
                      i < lives
                        ? "bg-muted-foreground scale-100"
                        : "bg-border scale-75"
                    }`}
                  />
                ))}
              </span>
              <span className="tabular-nums">
                {bricks} {i18n.notFound.game.left}
              </span>
            </span>

            {/* The instruction stays put for the whole game, the way the
                restart sits under the result. It used to retire after the first
                move, which quietly assumed everyone would remember it. */}
            <span className="text-muted-foreground/70">
              {i18n.notFound.game.hint}
            </span>
          </div>
        )}

        {/* Result above, action below: the outcome is the sentence and the
            restart is the footnote, which side by side they were not. */}
        {over && (
          <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 flex flex-col items-center gap-1.5 duration-500">
            <span className="text-foreground text-sm">
              {phase === "won"
                ? i18n.notFound.game.won
                : i18n.notFound.game.lost}
            </span>
            <button
              type="button"
              onClick={() => startRef.current()}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring cursor-pointer rounded-sm font-mono text-[11px] tracking-wide underline underline-offset-4 transition-colors focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {i18n.notFound.game.again}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
