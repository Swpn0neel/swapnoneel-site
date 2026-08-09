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

/**
 * Vanilla port of components/four-oh-four-breakout.tsx.
 *
 * Physics still lives in lib/breakout-engine.ts, which knows nothing about the
 * DOM and is unchanged. This file owns layout, input, painting and the HUD —
 * the same split as before, minus React.
 *
 * The React version kept `stats`, `height`, `textH` and `coarse` in state
 * purely to re-render the HUD. Every HUD state is now in the markup from the
 * start and switched with a data attribute, so a brick count changing several
 * times a second touches one text node instead of reconciling a tree.
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
 * inside a normal arc without making the paddle twitchy — it is still 74px
 * wide, so a pixel of jitter is nothing.
 */
const TOUCH_GAIN = 1.45;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function initBreakout(root: HTMLElement): void {
  const wrap = root.querySelector<HTMLElement>("[data-game-wrap]");
  const text = root.querySelector<HTMLParagraphElement>("[data-game-text]");
  const canvas = root.querySelector<HTMLCanvasElement>("canvas");
  const hudLives = root.querySelector<HTMLElement>("[data-game-lives]");
  const hudBricks = root.querySelector<HTMLElement>("[data-game-bricks]");
  const hudHint = root.querySelector<HTMLElement>("[data-game-hint]");
  const hudResult = root.querySelector<HTMLElement>("[data-game-result]");
  const live = root.querySelector<HTMLElement>("[data-game-live]");
  if (!wrap || !text || !canvas || !hudLives || !hudBricks || !hudHint || !hudResult || !live) {
    return;
  }

  let raf = 0;
  let last = 0;
  let textH = 0;
  let coarse = false;
  /** The finger currently steering the paddle, and where it was last seen.
   *  Null for a mouse, which steers absolutely and needs no anchor. */
  let drag: { id: number; x: number } | null = null;
  /** Arrow keys currently held. A set rather than a direction because both can
   *  be down at once, and releasing one should hand steering back to the other
   *  rather than stop the paddle dead. */
  const held = new Set<string>();

  let stats: Stats = { phase: "idle", bricks: 0, lives: LIVES, stuck: true };
  let lastStuck = stats.stuck;
  let lastPhase: Stats["phase"] | null = null;

  /**
   * Replays a CSS entrance animation on an element that is already in the
   * document. React got this free by mounting the element; here every HUD state
   * is present from the start and only revealed, so the animation has to be
   * restarted by hand — remove the class, force a reflow, add it back.
   */
  const replayEnter = (el: Element | null | undefined) => {
    if (!el) return;
    el.classList.remove("game-enter");
    void (el as HTMLElement).offsetWidth;
    el.classList.add("game-enter");
  };

  const engine = new BreakoutEngine((next) => {
    stats = next;
    renderHud();
  });

  const lifeDots = Array.from(
    hudLives.querySelectorAll<HTMLElement>("[data-life]")
  );

  function renderHud() {
    const { phase, bricks, lives, stuck } = stats;
    const playing = phase === "playing";
    const over = phase === "won" || phase === "lost";

    root.dataset.phase = phase;
    if (phase !== lastPhase) {
      lastPhase = phase;
      // ~= because the result block serves both "won" and "lost".
      replayEnter(root.querySelector(`[data-game-block~="${phase}"]`));
    }

    canvas!.tabIndex = playing ? 0 : -1;
    canvas!.setAttribute("aria-hidden", String(!playing));
    canvas!.style.opacity = playing ? "1" : "0";
    // Only swallow touch scrolling while the game is actually running.
    canvas!.style.touchAction = playing ? "none" : "auto";
    canvas!.style.cursor = playing ? "none" : "pointer";
    text!.setAttribute("aria-hidden", String(playing));
    text!.style.opacity = playing ? "0" : "1";

    // Both outcomes hand the page back: the field closes, the bricks fade out
    // and the real headline fades in behind them.
    wrap!.style.height = `${playing ? engine.h : textH}px`;

    for (const [i, dot] of lifeDots.entries()) {
      dot.dataset.on = String(i < lives);
    }
    hudLives!.setAttribute("aria-label", i18n.notFound.game.livesLabel(lives));
    hudBricks!.textContent = `${bricks} ${i18n.notFound.game.left}`;

    const hints = coarse ? i18n.notFound.game.hintTouch : i18n.notFound.game.hint;
    hudHint!.textContent = stuck ? hints.serve : hints.aim;
    // The instruction tracks the ball rather than standing still. React
    // replaced the element via `key`, which replayed the entrance animation; a
    // swap you notice is the point, since a line that silently rewrote itself
    // would look like one nobody read carefully. Restarting the animation by
    // hand is the same effect without the remount.
    if (stuck !== lastStuck) {
      lastStuck = stuck;
      replayEnter(hudHint);
    }

    hudResult!.textContent = over
      ? phase === "won"
        ? i18n.notFound.game.won
        : i18n.notFound.game.lost
      : "";

    // Announcements only work if the live region was already in the document
    // when its text changed. Brick counts are deliberately left out: they
    // change several times a second and would bury the two events that matter.
    live!.textContent = over
      ? phase === "won"
        ? i18n.notFound.game.won
        : i18n.notFound.game.lost
      : playing && lives < LIVES
        ? i18n.notFound.game.livesLabel(lives)
        : "";
  }

  function draw() {
    const ctx = canvas!.getContext("2d");
    if (!ctx) return;

    // Colour comes from the canvas's own computed `color`, so everything tracks
    // the theme through the same token the headline uses.
    const ink = getComputedStyle(canvas!).color;
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
    // the device was slow: the same eight dots covered twice the ground at
    // 30fps as at 60. Spacing them by distance decouples what the trail looks
    // like from how often it was measured.
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
  }

  /** Sets the backing store to device pixels while the drawing code stays in
   *  CSS pixels, so the wall is crisp on a retina screen. */
  function applySize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas!.width = Math.round(w * dpr);
    canvas!.height = Math.round(h * dpr);
    canvas!.style.height = `${h}px`;
    canvas!.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    engine.resize(w, h);
    wrap!.style.height = `${engine.phase === "playing" ? h : textH}px`;
  }

  /**
   * Measures the box the real headline occupies and lays the wall into exactly
   * that rectangle, so the bricks take over the footprint the type just had.
   */
  function wallFromHeadline(w: number): Brick[] {
    const cs = getComputedStyle(text!);
    const fontPx = parseFloat(cs.fontSize);

    const probe = document.createElement("canvas").getContext("2d");
    if (!probe) return [];
    probe.font = `${cs.fontWeight} ${fontPx}px ${cs.fontFamily}`;
    probe.textAlign = "center";
    probe.textBaseline = "alphabetic";

    const m = probe.measureText("404");
    const tRect = text!.getBoundingClientRect();
    const wRect = wrap!.getBoundingClientRect();

    // Where the browser actually put the baseline, per the CSS inline box
    // model: the content area is the font's own ascent+descent, centred in the
    // line box, and the baseline sits an ascent below that. Deriving it from
    // the *ink* ascent instead lands the wall a few pixels off, because ink
    // height and font height are not the same number.
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
  }

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    engine.tick(dt);
    draw();
  };

  function start() {
    // Measuring before the face resolves would size the wall to the fallback's
    // metrics, not Inter's, and the bricks would miss the headline's box.
    const begin = () => {
      const w = wrap!.clientWidth;
      textH = text!.offsetHeight;
      applySize(w, textH + FIELD);
      engine.setWall(wallFromHeadline(w));
      engine.start();
      // Paint once up front. The text has already crossfaded to nothing by this
      // point, so if the first animation frame is late — a backgrounded tab, a
      // throttled renderer — the headline would otherwise just vanish.
      draw();
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
      canvas!.focus({ preventScroll: true });
    };
    if (document.fonts?.ready) void document.fonts.ready.then(begin);
    else begin();
  }

  const move = (clientX: number) => {
    engine.movePaddleTo(clientX - canvas!.getBoundingClientRect().left);
  };

  /** Resolves the held keys down to one direction and hands it to the engine,
   *  which does the moving. */
  const syncSteer = () => {
    engine.steer(
      (held.has("ArrowRight") ? 1 : 0) - (held.has("ArrowLeft") ? 1 : 0)
    );
  };

  const endDrag = (id: number) => {
    if (drag?.id === id) drag = null;
  };

  /* ── setup ─────────────────────────────────────────────────────────────── */

  textH = text.offsetHeight;
  applySize(wrap.clientWidth, textH);

  // The CSS side is handled by motion-safe:, but the canvas effects are
  // hand-rolled, so the engine has to be told directly.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const syncMotion = () => {
    engine.reduced = reduced.matches;
    if (reduced.matches) {
      engine.reveal = 1;
      engine.debris = [];
      engine.trail = [];
    }
  };
  syncMotion();
  reduced.addEventListener("change", syncMotion);

  // Only decides which hint to print — what the controls actually do is decided
  // per event from `pointerType`, so a laptop with both a trackpad and a
  // touchscreen behaves correctly on whichever one is in hand.
  const touch = window.matchMedia("(pointer: coarse)");
  const syncPointer = () => {
    coarse = touch.matches;
    renderHud();
  };
  syncPointer();
  touch.addEventListener("change", syncPointer);

  const ro = new ResizeObserver(() => {
    // The canvas keeps its full field size for as long as it is on screen,
    // including while it fades out after the game; only the wrapper shrinks.
    const onScreen = engine.phase !== "idle";
    const w = wrap.clientWidth;
    textH = text.offsetHeight;
    applySize(w, textH + (onScreen ? FIELD : 0));
    // A resize invalidates every brick coordinate, so the wall is rebuilt from
    // the newly laid-out text rather than stretched.
    if (onScreen) {
      engine.setWall(wallFromHeadline(w));
      // No glide here: the field itself moved, so there is no previous position
      // worth travelling from.
      engine.resetBall(false);
    }
    draw();
  });
  // The wrapper is capped at 460px, so its width stops changing well before the
  // viewport does — but the headline is sized in vw and keeps scaling. Watching
  // the text too is what catches that.
  ro.observe(wrap);
  ro.observe(text);

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
  window.addEventListener("pointermove", (event) => {
    if (engine.phase !== "playing") return;
    if (event.pointerType === "touch") return;
    move(event.clientX);
  });

  // Starting the game is bound to the click and not to the press, because at
  // rest the canvas is transparent and lying over the headline: on a phone, a
  // press is also the first moment of a scroll, and starting there meant
  // flicking past the 404 launched a game.
  canvas.addEventListener("click", () => {
    if (engine.phase !== "playing") start();
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (engine.phase !== "playing") return;
    if (event.pointerType !== "touch") {
      // A mouse has already been steering by hovering, so the click is only
      // ever the serve. It also clears any finger still on record: on a laptop
      // with a touchscreen, a drag that never got its release would otherwise
      // hold the paddle hostage and the mouse would move nothing.
      drag = null;
      move(event.clientX);
      engine.launch();
      return;
    }
    // A finger has no hover, so the press is where aiming starts and cannot
    // also be the serve — that fired the ball at whatever the first frame of a
    // drag happened to be pointing at. Lifting serves instead, which makes
    // press-slide-release one gesture.
    canvas.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, x: event.clientX };
  });

  // Touch only. The mouse is steered from the window listener above, so that it
  // keeps working past the edges of the field.
  canvas.addEventListener("pointermove", (event) => {
    if (engine.phase !== "playing") return;
    if (!drag || drag.id !== event.pointerId) return;
    engine.nudge((event.clientX - drag.x) * TOUCH_GAIN);
    drag.x = event.clientX;
  });

  canvas.addEventListener("pointerup", (event) => {
    if (drag?.id !== event.pointerId) return;
    endDrag(event.pointerId);
    if (engine.phase === "playing") engine.launch();
  });

  // A cancelled pointer is the system taking the gesture away — a notification,
  // a gesture-nav swipe. Letting go of the paddle is right; serving off it
  // would be a shot nobody took.
  canvas.addEventListener("pointercancel", (event) => endDrag(event.pointerId));

  canvas.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      // Repeats land here too and re-add a key already in the set, which is
      // exactly the point: the set is what is held, and the engine does the
      // moving on its own clock.
      held.add(event.key);
      syncSteer();
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (engine.phase === "playing") engine.launch();
      else start();
    }
  });

  canvas.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      held.delete(event.key);
      syncSteer();
    }
  });

  // Losing focus mid-press means the keyup is delivered somewhere else and
  // never arrives here, which would leave the paddle steering into the wall for
  // the rest of the game.
  canvas.addEventListener("blur", () => {
    held.clear();
    syncSteer();
  });

  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-game-start]")) {
    button.addEventListener("click", () => start());
  }

  renderHud();
}
