/**
 * The simulation behind the 404 headline. Deliberately free of React and of
 * anything that needs a compositor: `tick(dt)` advances the world by a fixed
 * slice, so the whole thing can be driven from a test at whatever rate the test
 * likes. The component owns the animation frames; this owns the physics.
 *
 * See scripts/breakout-balance.mjs for the balance run that pins the numbers
 * below — a clean playthrough should land around a minute, not five.
 */

export type Phase = "idle" | "playing" | "won" | "lost";
export type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  /** 0–1 position in the assembly sweep, so the wall can build in rather than
   *  appear all at once. Fixed at build time to keep the order stable. */
  seq: number;
};
/** A brick that has been hit, briefly outliving itself so every hit lands. */
export type Debris = {
  x: number;
  y: number;
  w: number;
  h: number;
  life: number;
};
export type Stats = {
  phase: Phase;
  bricks: number;
  lives: number;
  /** True while the ball is parked on the paddle waiting to be served. The HUD
   *  reads it to tell the player which half of the controls is live. */
  stuck: boolean;
};

/** Seconds for the wall to finish assembling. */
const REVEAL_S = 0.55;
/** Seconds a struck brick spends fading out. Short and small on purpose — this
 *  fires dozens of times a game, so anything showy becomes noise. */
const DEBRIS_S = 0.18;
/** Seconds the paddle stays compressed after a bounce. */
const SQUASH_S = 0.16;
/** Seconds of flight kept for the motion trail. A duration rather than a count
 *  of frames: the trail used to be the last eight sampled positions, so how far
 *  it reached across the field was however far the ball happened to travel
 *  between frames. On a desktop at 60fps that is a short comet; on a phone at
 *  30 it is the same eight dots strung over twice the ground, which is exactly
 *  what the smear on mobile was. Keeping a fixed slice of the ball's past makes
 *  the streak the same length everywhere, and the renderer spaces the dots
 *  along it by distance so it looks the same too. The value is not free choice:
 *  it is the eight frames at 60fps the old trail spanned, plus half a frame for
 *  where the oldest surviving sample falls inside the window — so a desktop
 *  keeps the streak it already had. */
const TRAIL_S = 0.14;
/** Seconds for the paddle to glide back to centre after a life is lost. It used
 *  to teleport, which was the single cheapest-looking moment in the game. */
const PADDLE_GLIDE_S = 0.42;
/** Seconds for the ball and paddle to fade once the game is over, so they leave
 *  rather than blink out. */
const END_S = 0.3;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The wall, as a designed digit matrix rather than a downsampled typeface.
 *
 * Sampling Inter's own glyphs was the first approach and it looked worse at
 * every resolution that kept the game short: a bold 4's counter is a thin
 * triangle, and quantising it to a handful of cells either floods it solid or
 * eats the diagonal, so the wall read as a blob. Pixel matrices are a separate
 * craft from typefaces for exactly this reason — a person decides which cells
 * are lit. The wall is still laid into the box the real headline occupies, so
 * the footprint matches even though the letterforms are drawn for the grid.
 */
const GLYPHS: Record<string, readonly string[]> = {
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
};
const WORD = "404";
const GLYPH_W = 5;
const GLYPH_GAP = 1;
const WALL_ROWS = 7;
const WALL_COLS = WORD.length * GLYPH_W + (WORD.length - 1) * GLYPH_GAP;

/** Lays the matrix into an arbitrary box. Pure geometry, so the balance script
 *  builds the identical wall the page does. */
export function buildWall(box: {
  left: number;
  top: number;
  right: number;
  bottom: number;
}): Brick[] {
  const cw = (box.right - box.left) / WALL_COLS;
  const ch = (box.bottom - box.top) / WALL_ROWS;
  const bricks: Brick[] = [];

  for (let g = 0; g < WORD.length; g++) {
    const rows = GLYPHS[WORD[g]];
    const colBase = g * (GLYPH_W + GLYPH_GAP);
    for (let r = 0; r < WALL_ROWS; r++) {
      for (let c = 0; c < GLYPH_W; c++) {
        if (rows[r][c] !== "#") continue;
        const col = colBase + c;
        bricks.push({
          x: box.left + col * cw,
          y: box.top + r * ch,
          w: cw,
          h: ch,
          alive: true,
          // Diagonal sweep: the wall builds from the top-left corner outward,
          // which reads as construction rather than as a plain wipe.
          seq: (col / WALL_COLS + r / WALL_ROWS) / 2,
        });
      }
    }
  }
  return bricks;
}

export const PADDLE_W = 74;
export const PADDLE_H = 7;
export const PADDLE_BOTTOM = 16;
export const BALL_R = 4.5;
export const LIVES = 3;

const BALL_SPEED = 430;
const BALL_MAX = 700;
/** Ball speed gained per paddle hit. */
const RAMP = 1.018;
/** Fraction of total speed the horizontal component may never drop below. */
const MIN_SLOPE = 0.24;
/** Bricks remaining before the endgame nudge switches on, and how hard it
 *  pulls. Both come off the balance run rather than taste: at 5 bricks / 190
 *  the slowest playthroughs ran past two minutes, and at 9 / 250 they still
 *  clipped two. Widening the window is what actually shortened the tail —
 *  strengthening the pull alone just made the last brick feel magnetic. */
const ASSIST_AT = 12;
/** Sideways acceleration of that nudge, in px/s². */
const ASSIST_PULL = 330;
/** How fast a held arrow key slides the paddle, in px/s. Close to the ~840px/s
 *  the old per-keypress version reached once the OS key repeat got going — the
 *  speed was never the problem, the half-second of nothing before the repeat
 *  started was. Above BALL_MAX on purpose, so the paddle can always out-run the
 *  ball's horizontal component rather than merely tie with it. */
const PADDLE_SPEED = 820;

export class BreakoutEngine {
  private onStats: (s: Stats) => void;
  private stuck = true;

  phase: Phase = "idle";
  bricks: Brick[] = [];
  lives = LIVES;
  w = 0;
  h = 0;
  paddleX = 0;
  ball = { x: 0, y: 0, vx: 0, vy: 0 };
  /** -1, 0 or 1: which way the keyboard is currently pushing. A direction the
   *  tick keeps acting on, rather than a step, which is what makes a held arrow
   *  slide instead of stutter. */
  paddleDir = 0;

  /* Presentation state. It lives here rather than in the component because it
     is time-based, and time is what tick() owns — a renderer that derived it
     from wall-clock would drift out of step with the physics. */

  /** 0–1 assembly progress for the wall. */
  reveal = 0;
  debris: Debris[] = [];
  /** Recent ball positions, each stamped with the engine time it was taken at
   *  so the trail can be trimmed by age instead of by however many frames the
   *  device managed to render. */
  trail: { x: number; y: number; t: number }[] = [];
  /** 1 immediately after a paddle bounce, decaying to 0. */
  squash = 0;
  /** 0–1 as the ball and paddle leave once the game is over. */
  endFade = 0;
  /** 0–1 progress of the paddle gliding back to centre. 1 means settled, which
   *  is also what the ball's fade-in rides on. */
  settle = 1;
  /** Set from the media query; collapses every effect above to its end state. */
  reduced = false;

  private glideFrom = 0;
  private glideTo = 0;
  /** Seconds since the engine was created. Only ever read as a difference, so
   *  it never needs resetting. */
  private clock = 0;

  constructor(onStats: (s: Stats) => void) {
    this.onStats = onStats;
  }

  get alive() {
    let n = 0;
    for (const b of this.bricks) if (b.alive) n++;
    return n;
  }

  private emit() {
    this.onStats({
      phase: this.phase,
      bricks: this.alive,
      lives: this.lives,
      stuck: this.stuck,
    });
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  setWall(bricks: Brick[]) {
    this.bricks = bricks;
    this.emit();
  }

  /**
   * `glide` is false only when the paddle has no meaningful previous position —
   * a fresh game, or a resize that moved the whole field. Everywhere else it
   * travels back to centre, because teleporting after a lost ball was the
   * single cheapest-looking moment in the game.
   */
  resetBall(glide = true) {
    this.stuck = true;
    const centre = this.w / 2 - PADDLE_W / 2;

    if (glide && !this.reduced) {
      this.glideFrom = this.paddleX;
      this.glideTo = centre;
      this.settle = 0;
    } else {
      this.paddleX = centre;
      this.settle = 1;
    }

    this.ball = {
      x: this.paddleX + PADDLE_W / 2,
      y: this.h - PADDLE_BOTTOM - BALL_R - 1,
      vx: 0,
      vy: 0,
    };
    // `stuck` is on the HUD now, so every path that parks the ball has to say
    // so — including the resize, which is the one that does not emit after.
    this.emit();
  }

  start() {
    this.phase = "playing";
    this.lives = LIVES;
    for (const b of this.bricks) b.alive = true;
    this.debris = [];
    this.trail = [];
    this.squash = 0;
    this.endFade = 0;
    this.reveal = this.reduced ? 1 : 0;
    // An arrow held down through the end of the last game would otherwise still
    // be steering this one, with no keyup ever coming to stop it.
    this.paddleDir = 0;
    // No glide on a fresh game: the paddle has no previous position to travel
    // from, so it simply arrives with the wall.
    this.resetBall(false);
    this.emit();
  }

  /** Advances the presentation. Separate from the physics because effects have
   *  to keep running after the game is over, so the last brick's fade and the
   *  final trail actually finish instead of freezing mid-air. */
  private tickEffects(dt: number) {
    this.clock += dt;

    // Trimming the trail by age here rather than in the physics is what lets it
    // drain after the game is over: nothing new is being pushed, so it retracts
    // into the ball over TRAIL_S instead of hanging in the air.
    while (this.trail.length > 0 && this.clock - this.trail[0].t > TRAIL_S) {
      this.trail.shift();
    }

    if (this.reveal < 1) this.reveal = Math.min(1, this.reveal + dt / REVEAL_S);
    if (this.squash > 0) this.squash = Math.max(0, this.squash - dt / SQUASH_S);

    // Paddle gliding home after a lost ball. Player input cancels this outright
    // rather than blending with it — smoothing direct manipulation would just
    // read as input lag.
    if (this.settle < 1) {
      this.settle = Math.min(1, this.settle + dt / PADDLE_GLIDE_S);
      const e = easeOutCubic(this.settle);
      this.paddleX = this.glideFrom + (this.glideTo - this.glideFrom) * e;
      if (this.stuck) this.ball.x = this.paddleX + PADDLE_W / 2;
    }

    const ending = this.phase === "won" || this.phase === "lost";
    if (ending && this.endFade < 1) {
      this.endFade = this.reduced ? 1 : Math.min(1, this.endFade + dt / END_S);
    } else if (!ending) {
      this.endFade = 0;
    }

    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.life -= dt / DEBRIS_S;
      if (d.life <= 0) this.debris.splice(i, 1);
    }
  }

  /**
   * A ball travelling straight up bounces between the paddle and the ceiling in
   * a single column forever once that column is clear — a real dead end, not a
   * theoretical one. Keeping a floor under the horizontal component means every
   * trip crosses new ground.
   */
  private deflect() {
    const b = this.ball;
    const sp = Math.hypot(b.vx, b.vy);
    const min = sp * MIN_SLOPE;
    if (Math.abs(b.vx) < min) {
      const dir = b.vx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(b.vx);
      b.vx = dir * min;
      b.vy =
        Math.sign(b.vy || -1) * Math.sqrt(Math.max(sp * sp - min * min, 1));
    }
  }

  /**
   * Hunting the last isolated brick can take minutes — fine in an arcade, wrong
   * on an error page. Once the wall is nearly down the rising ball is nudged
   * toward what is left. Speed is preserved, so it reads as luck, not as help.
   */
  private assist(dt: number) {
    const b = this.ball;
    if (b.vy >= 0) return;

    let live = 0;
    let best = Infinity;
    let target = 0;
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      live++;
      const cx = brick.x + brick.w / 2;
      const d = Math.abs(cx - b.x);
      if (d < best) {
        best = d;
        target = cx;
      }
    }
    if (live === 0 || live > ASSIST_AT || best < 3) return;

    const sp = Math.hypot(b.vx, b.vy);
    b.vx += (target > b.x ? 1 : -1) * ASSIST_PULL * dt;
    const m = Math.hypot(b.vx, b.vy) || 1;
    b.vx = (b.vx / m) * sp;
    b.vy = (b.vy / m) * sp;
  }

  launch() {
    if (!this.stuck || this.phase !== "playing") return;
    this.stuck = false;
    const a = -Math.PI / 2 + (Math.random() * 0.7 - 0.35);
    this.ball.vx = Math.cos(a) * BALL_SPEED;
    this.ball.vy = Math.sin(a) * BALL_SPEED;
    this.deflect();
    this.emit();
  }

  /**
   * Held-key steering, as a direction rather than a step.
   *
   * The keyboard used to move the paddle a fixed 28px per keydown, which hands
   * the pacing to the operating system's key repeat: nothing at all for the
   * repeat delay — half a second on a stock configuration — and then a stutter
   * at whatever rate the OS chose. Holding an arrow now sets a direction the
   * tick integrates, so the paddle simply moves.
   */
  steer(dir: number) {
    this.paddleDir = Math.sign(dir);
  }

  /** `x` is already local to the canvas; the caller owns the rect maths. */
  movePaddleTo(x: number) {
    this.settle = 1;
    this.paddleX = Math.max(0, Math.min(this.w - PADDLE_W, x - PADDLE_W / 2));
  }

  nudge(dx: number) {
    this.settle = 1;
    this.paddleX = Math.max(0, Math.min(this.w - PADDLE_W, this.paddleX + dx));
  }

  tick(dt: number) {
    this.tickEffects(dt);
    if (this.phase !== "playing") return;
    const b = this.ball;

    // Keyboard steering, integrated before anything reads paddleX — so a ball
    // still parked on the paddle rides along with it below.
    if (this.paddleDir !== 0) {
      // Cancels the glide home, for the reason a mouse does: smoothing a
      // movement the player is actively making reads as lag.
      this.settle = 1;
      this.nudge(this.paddleDir * PADDLE_SPEED * dt);
    }

    if (this.stuck) {
      b.x = this.paddleX + PADDLE_W / 2;
      b.y = this.h - PADDLE_BOTTOM - BALL_R - 1;
      this.trail.length = 0;
      return;
    }

    if (!this.reduced) this.trail.push({ x: b.x, y: b.y, t: this.clock });

    this.assist(dt);
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.x < BALL_R) {
      b.x = BALL_R;
      b.vx = -b.vx;
    }
    if (b.x > this.w - BALL_R) {
      b.x = this.w - BALL_R;
      b.vx = -b.vx;
    }
    if (b.y < BALL_R) {
      b.y = BALL_R;
      b.vy = -b.vy;
    }

    const top = this.h - PADDLE_BOTTOM;
    if (
      b.vy > 0 &&
      b.y + BALL_R >= top &&
      b.y < top + PADDLE_H + 6 &&
      b.x > this.paddleX - 4 &&
      b.x < this.paddleX + PADDLE_W + 4
    ) {
      const hit = (b.x - (this.paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
      const ang = -Math.PI / 2 + hit * 1.05;
      const sp = Math.min(Math.hypot(b.vx, b.vy) * RAMP, BALL_MAX);
      b.vx = Math.cos(ang) * sp;
      b.vy = Math.sin(ang) * sp;
      b.y = top - BALL_R;
      this.deflect();
      this.squash = 1;
    }

    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (
        b.x + BALL_R > brick.x &&
        b.x - BALL_R < brick.x + brick.w &&
        b.y + BALL_R > brick.y &&
        b.y - BALL_R < brick.y + brick.h
      ) {
        brick.alive = false;
        if (!this.reduced) {
          this.debris.push({
            x: brick.x,
            y: brick.y,
            w: brick.w,
            h: brick.h,
            life: 1,
          });
        }
        const overX = Math.min(
          b.x + BALL_R - brick.x,
          brick.x + brick.w - (b.x - BALL_R)
        );
        const overY = Math.min(
          b.y + BALL_R - brick.y,
          brick.y + brick.h - (b.y - BALL_R)
        );
        if (overX < overY) b.vx = -b.vx;
        else b.vy = -b.vy;

        if (this.alive === 0) this.phase = "won";
        this.emit();
        break;
      }
    }

    if (b.y - BALL_R > this.h) {
      this.lives -= 1;
      if (this.lives <= 0) this.phase = "lost";
      else this.resetBall();
      this.emit();
    }
  }
}
