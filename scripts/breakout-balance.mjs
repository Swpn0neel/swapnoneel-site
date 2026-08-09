// Balance run for the 404 headline game.
//
// The engine is deliberately free of DOM and animation frames, so a clean
// playthrough can be simulated here at whatever speed we like. This pins the
// two failure modes that are invisible in a quick manual play: a ball that gets
// stuck bouncing in a cleared column forever, and an endgame spent hunting one
// isolated brick. Both used to happen; both are guarded in the engine.
//
//   node scripts/breakout-balance.mjs
//
// Node's native type stripping runs the .ts engine directly — no build step.

import { BreakoutEngine, buildWall, PADDLE_W } from "../lib/breakout-engine.ts";

// Matches the desktop layout: a 460px field under a ~160px headline.
const W = 460;
const H = 344;
const RUNS = 24;
const STEP = 1 / 60;
const CAP_S = 240;

/** The page's own wall builder, given the box a ~192px headline occupies at
 *  this width — so the simulation plays the exact wall the page does. */
function wall() {
  return buildWall({ left: 36, right: W - 36, top: 14, bottom: 151 });
}

const results = [];
let everStalled = false;

for (let run = 0; run < RUNS; run++) {
  const engine = new BreakoutEngine(() => {});
  engine.resize(W, H);
  engine.setWall(wall());
  engine.start();
  engine.launch();

  let t = 0;
  while (t < CAP_S && engine.phase === "playing") {
    // A competent but human player: tracks the ball, never perfectly. A perfect
    // tracker centres every bounce and hides the stuck-ball bug entirely.
    const aim = engine.ball.x + (Math.random() - 0.5) * 14;
    engine.movePaddleTo(
      Math.max(PADDLE_W / 2, Math.min(W - PADDLE_W / 2, aim))
    );
    engine.tick(STEP);
    if (engine.ball.vx === 0 && engine.ball.vy === 0) engine.launch();
    t += STEP;
  }

  if (engine.phase === "playing") everStalled = true;
  results.push({ phase: engine.phase, seconds: t, left: engine.alive });
}

const cleared = results.filter((r) => r.phase === "won");
const times = cleared.map((r) => r.seconds).sort((a, b) => a - b);
const median = times.length ? times[Math.floor(times.length / 2)] : NaN;
const worst = times[times.length - 1];

for (const r of results) {
  console.log(
    `  ${r.phase.padEnd(8)} ${r.seconds.toFixed(1)}s  ${r.left} left`
  );
}
console.log(
  `\ncleared ${cleared.length}/${RUNS} · median ${median.toFixed(1)}s · ` +
    `range ${times[0]?.toFixed(1)}–${worst?.toFixed(1)}s`
);

const problems = [];
if (everStalled)
  problems.push(`a run never finished inside ${CAP_S}s (stuck ball?)`);
if (cleared.length < RUNS)
  problems.push(`${RUNS - cleared.length} run(s) did not clear`);
if (median > 90)
  problems.push(`median ${median.toFixed(1)}s is too long for an error page`);
if (median < 20)
  problems.push(`median ${median.toFixed(1)}s is over before it starts`);
// The tail is what actually ruins this: one player in ten grinding out the last
// brick for two minutes is worse than everyone taking slightly longer.
if (worst > 120)
  problems.push(`slowest run ${worst.toFixed(1)}s — endgame drags`);

if (problems.length) {
  console.error("\nFAIL: " + problems.join("; "));
  process.exit(1);
}
console.log("OK");
