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
 * Idle it is ordinary text — server-rendered, real, and identical to what the
 * page would show if this component never hydrated. Only on a deliberate press
 * does it become a Breakout wall.
 *
 * That text is not selectable, and this used to claim it was. The canvas lies
 * over it at zero opacity the whole time and takes the pointer, so the claim
 * was never true in a browser; what has changed is that the overlay now earns
 * it, because clicking the numeral is what starts the game. Reaching for the
 * biggest thing on the page is the instinct worth serving here — the 10px
 * "break it" underneath was the only way in, and it is a poor bet against a
 * headline four hundred times its area.
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
/** Dots in the ball's motion trail. Eight is what the old one-dot-per-frame
 *  version drew, and at 60fps it is the same picture — the difference is that
 *  now every device gets it. */
const TRAIL_DOTS = 8;
/**
 * Paddle travel per pixel of finger travel on a touch drag.
 *
 * Above 1 because the paddle's full run is nearly the width of a phone, and a
 * thumb cannot comfortably sweep that far; a little over-travel puts both edges
 * inside a normal arc without making the paddle twitchy — it is still 74px wide,
 * so a pixel of jitter is nothing.
 */
const TOUCH_GAIN = 1.45;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function FourOhFourBreakout() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BreakoutEngine | null>(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  /** The finger currently steering the paddle, and where it was last seen.
   *  Null for a mouse, which steers absolutely and needs no anchor. */
  const dragRef = useRef<{ id: number; x: number } | null>(null);
  /** Arrow keys currently held. A set rather than a direction because both can
   *  be down at once, and releasing one should hand steering back to the
   *  other rather than stop the paddle dead. */
  const heldRef = useRef<Set<string>>(new Set());

  const [stats, setStats] = useState<Stats>({
    phase: "idle",
    bricks: 0,
    lives: LIVES,
    stuck: true,
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
    //
    // The dots are placed by walking the path the ball actually took and
    // stepping along it, rather than by drawing one per stored sample. Samples
    // arrive at the frame rate, so a dot per sample made the streak as long as
    // the device was slow: the same eight dots covered twice the ground at 30fps
    // as at 60, which is why the ball smeared on phones and looked right on a
    // desktop. Spacing them by distance decouples what the trail looks like from
    // how often it was measured.
    const path = engine.trail;
    if (path.length > 1) {
      // Cumulative length at each sample, so the walk below is a single pass.
      const dist = [0];
      for (let i = 1; i < path.length; i++) {
        dist.push(
          dist[i - 1] +
            Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
        );
      }
      const total = dist[dist.length - 1];
      // Below about a pixel of travel the ball is effectively parked and the
      // dots would all stack up inside it.
      if (total > 1) {
        let seg = 1;
        for (let i = 0; i < TRAIL_DOTS; i++) {
          // 0 at the tail, 1 at the ball: dots grow and firm up towards the head.
          const t = (i + 1) / (TRAIL_DOTS + 1);
          const d = total * t;
          while (seg < dist.length - 1 && dist[seg] < d) seg++;
          const span = dist[seg] - dist[seg - 1] || 1;
          const f = (d - dist[seg - 1]) / span;
          ctx.globalAlpha = t * 0.22;
          ctx.beginPath();
          ctx.arc(
            path[seg - 1].x + (path[seg].x - path[seg - 1].x) * f,
            path[seg - 1].y + (path[seg].y - path[seg - 1].y) * f,
            BALL_R * t,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
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

  // Only decides which hint to print — what the controls actually do is decided
  // per event from `pointerType`, so a laptop with both a trackpad and a
  // touchscreen behaves correctly on whichever one is in hand.
  const [coarse, setCoarse] = useState(false);

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

    const touch = window.matchMedia("(pointer: coarse)");
    const syncPointer = () => setCoarse(touch.matches);
    syncPointer();
    touch.addEventListener("change", syncPointer);

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
      touch.removeEventListener("change", syncPointer);
      cancelAnimationFrame(rafRef.current);
      engineRef.current = null;
    };
  }, [applySize, draw, wallFromHeadline]);

  const { phase, bricks, lives, stuck } = stats;
  const playing = phase === "playing";
  const over = phase === "won" || phase === "lost";

  /**
   * The mouse steers from the window, not from the canvas.
   *
   * Bound to the canvas, the pointer only had to stray a few pixels past the
   * field for the paddle to freeze — and the pixels just below it, where a hand
   * chasing the paddle naturally ends up, are the easiest ones in the layout to
   * reach. `cursor: none` then hid where the pointer had gone, so the failure
   * looked like the game had locked up rather than like the mouse had left.
   *
   * Touch is deliberately not handled here: it holds an explicit pointer
   * capture on the canvas and steers by relative movement, so it neither needs
   * this nor wants the absolute jump it would apply.
   */
  useEffect(() => {
    if (!playing) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const cv = canvasRef.current;
      if (!cv) return;
      engineRef.current?.movePaddleTo(
        e.clientX - cv.getBoundingClientRect().left
      );
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [playing]);

  const move = (clientX: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    engineRef.current?.movePaddleTo(clientX - cv.getBoundingClientRect().left);
  };

  const nudge = (dx: number) => {
    engineRef.current?.nudge(dx);
  };

  /** Resolves the held keys down to one direction and hands it to the engine,
   *  which does the moving. Called on every key change rather than tracked as
   *  React state: this runs on keydown repeats and must not re-render. */
  const syncSteer = () => {
    const held = heldRef.current;
    engineRef.current?.steer(
      (held.has("ArrowRight") ? 1 : 0) - (held.has("ArrowLeft") ? 1 : 0)
    );
  };

  /**
   * A touch steers the paddle relative to where the finger started, not by
   * snapping it under the finger the way the mouse does.
   *
   * Two things went wrong with the absolute version on a phone, and they are
   * the same thing twice: a thumb is wider than the paddle and lands on the one
   * strip of the field the game is about, so pressing to play covered the
   * paddle and the ball arriving at it, and the press itself teleported the
   * paddle out from under wherever the ball was. Anchoring on first contact
   * means the finger can sit anywhere comfortable — halfway up the field, off
   * to one side — and the bottom of the field stays visible.
   */
  const endDrag = (id: number) => {
    if (dragRef.current?.id === id) dragRef.current = null;
  };

  // Both outcomes hand the page back: the field closes, the bricks fade out and
  // the real headline fades in behind them. Winning used to collapse the space
  // to nothing, which left the page with a hole where the 404 had been.
  const displayHeight = playing ? height : textH;

  return (
    <div className="flex flex-col items-center">
      <div
        ref={wrapRef}
        className="group relative mx-auto w-full max-w-[460px] overflow-hidden motion-safe:transition-[height] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ height: displayHeight ?? undefined }}
      >
        {/* Warms one step towards full strength while the numeral is being
            hovered, which is the only thing telling a mouse that the biggest
            object on the page is also a button. Only ever visible at rest: in
            play this is at zero opacity, so the group is free to match the
            pointer sitting on the canvas the whole time. */}
        <p
          ref={textRef}
          aria-hidden={playing}
          className="text-muted-foreground group-hover:text-body-foreground pointer-events-none absolute inset-x-0 top-0 m-0 text-center text-[clamp(4rem,34vw,10rem)] leading-none font-bold transition-[color,opacity] duration-300"
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
          className="text-muted-foreground focus-visible:ring-ring absolute inset-x-0 top-0 block w-full rounded-sm transition-opacity duration-300 select-none focus-visible:ring-1 focus-visible:outline-none"
          style={{
            // Crossfades with the headline: the bricks go as the real 404
            // comes back, while the field closes underneath them.
            opacity: playing ? 1 : 0,
            // Only swallow touch scrolling while the game is actually running.
            touchAction: playing ? "none" : "auto",
            cursor: playing ? "none" : "pointer",
            // Holding a corner of the field to steer is a long press, which iOS
            // would otherwise answer with a share sheet mid-rally.
            WebkitTouchCallout: "none",
          }}
          // Starting the game is bound to the click and not to the press,
          // because at rest this element is transparent and lying over the
          // headline: on a phone, a press is also the first moment of a scroll,
          // and starting there meant flicking past the 404 launched a game.
          //
          // The canvas is aria-hidden and untabbable at rest, so this is a
          // mouse-and-thumb shortcut rather than the way in — the "break it"
          // button below is the labelled, focusable control, and it is what
          // keyboard and screen reader users get.
          onClick={() => {
            if (!playing) startRef.current();
          }}
          onPointerDown={(e) => {
            if (!playing) return;
            if (e.pointerType !== "touch") {
              // A mouse has already been steering the paddle by hovering, so
              // the click is only ever the serve. It also clears any finger
              // still on record: on a laptop with a touchscreen, a drag that
              // never got its release would otherwise hold the paddle hostage
              // and the mouse would move nothing.
              dragRef.current = null;
              move(e.clientX);
              engineRef.current?.launch();
              return;
            }
            // A finger has no hover, so the press is where aiming starts and
            // cannot also be the serve — that fired the ball at whatever the
            // first frame of a drag happened to be pointing at. Lifting serves
            // instead, which makes press-slide-release one gesture.
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { id: e.pointerId, x: e.clientX };
          }}
          // Touch only. The mouse is steered from the window effect above, so
          // that it keeps working past the edges of the field.
          onPointerMove={(e) => {
            if (!playing) return;
            const drag = dragRef.current;
            if (!drag || drag.id !== e.pointerId) return;
            nudge((e.clientX - drag.x) * TOUCH_GAIN);
            drag.x = e.clientX;
          }}
          onPointerUp={(e) => {
            if (dragRef.current?.id !== e.pointerId) return;
            endDrag(e.pointerId);
            if (playing) engineRef.current?.launch();
          }}
          // A cancelled pointer is the system taking the gesture away — a
          // notification, a gesture-nav swipe. Letting go of the paddle is
          // right; serving off it would be a shot nobody took.
          onPointerCancel={(e) => endDrag(e.pointerId)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              // Repeats land here too and re-add a key already in the set,
              // which is exactly the point: the set is what is held, and the
              // engine does the moving on its own clock.
              heldRef.current.add(e.key);
              syncSteer();
            } else if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              if (playing) engineRef.current?.launch();
              else startRef.current();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              heldRef.current.delete(e.key);
              syncSteer();
            }
          }}
          // Losing focus mid-press means the keyup is delivered somewhere else
          // and never arrives here, which would leave the paddle steering into
          // the wall for the rest of the game.
          onBlur={() => {
            heldRef.current.clear();
            syncSteer();
          }}
        />
      </div>

      {/* Sized for the tallest state — every state is two centred lines — so
          nothing below moves as the game changes. `min-h` rather than `h`
          because a fixed height would clip instead of grow if a reader's font
          scale pushed the result onto a second line; at default sizes the
          longest message needs 219px of the 288px a 320px phone offers, so it
          never comes up in practice. Keep in step with the placeholder in
          components/four-oh-four-game-slot, which reserves the same box before
          this file has loaded. */}
      <div className="mt-5 flex min-h-11 flex-col items-center justify-center">
        {/* One region, always mounted, holding whatever is worth saying out
            loud — announcements only work if the live region was already in the
            document when its text changed, so it cannot be rendered alongside
            the thing it describes. Brick counts are deliberately left out: they
            change several times a second and would bury the two events that
            actually matter. */}
        <span className="sr-only" role="status" aria-live="polite">
          {over
            ? phase === "won"
              ? i18n.notFound.game.won
              : i18n.notFound.game.lost
            : playing && lives < LIVES
              ? i18n.notFound.game.livesLabel(lives)
              : ""}
        </span>

        {phase === "idle" && (
          <button
            type="button"
            onClick={() => startRef.current()}
            // The reachable area is grown with a pseudo-element rather than
            // padding: ten-pixel mono type is a fourteen-pixel-tall target,
            // which is a thumb's-width miss on a phone, but padding would drag
            // the focus ring out into a loose box around two small words and
            // eat into the height this row reserves. See the note on that
            // reserve below.
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring text-2xs relative cursor-pointer rounded-sm font-mono tracking-wide underline-offset-4 transition-colors before:absolute before:-inset-x-4 before:-inset-y-3 before:content-[''] hover:underline focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {i18n.notFound.game.idle}
          </button>
        )}

        {playing && (
          <div className="text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 text-2xs flex flex-col items-center gap-1.5 font-mono tracking-wide duration-300">
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

            {/* The instruction tracks the ball rather than standing still: how
                to serve while it is parked, how to aim once it is away. Keyed
                on which one it is, so React replaces the element and the
                entrance animation replays — a swap you notice happening, which
                is the point, since a line that silently rewrote itself would
                just look like a line nobody read carefully the first time. */}
            <span
              key={stuck ? "serve" : "aim"}
              className="text-faint-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 duration-300"
            >
              {
                (coarse
                  ? i18n.notFound.game.hintTouch
                  : i18n.notFound.game.hint)[stuck ? "serve" : "aim"]
              }
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
              // Same enlarged target as the idle button. It reaches up over the
              // gap into the result line, which is only text, so the whole
              // bottom of this block restarts the game.
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring text-2xs relative cursor-pointer rounded-sm font-mono tracking-wide underline underline-offset-4 transition-colors before:absolute before:-inset-x-4 before:-inset-y-3 before:content-[''] focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {i18n.notFound.game.again}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
