import { getRenderedTheme, type ResolvedTheme } from "@/lib/theme";
import { applyResolvedTheme, persistTheme } from "./theme-store";

/**
 * Vanilla port of components/theme-toggle.tsx. The React version held every
 * piece of its state in a ref rather than in state — nothing it tracked was
 * ever rendered — so this is the same algorithm with the refs as closure
 * variables, and no framework underneath it.
 */

// The wipe crosses from the toggle to the furthest corner, which is ~800px on a
// phone and ~2500px on the widest layout this container produces. Pacing it by
// distance keeps the edge at roughly constant speed instead of whipping across
// big screens. The clamps matter more than the rate: below the floor a
// full-viewport change reads as a flash rather than motion, above the ceiling
// the visitor is waiting on something they already asked for.
const REVEAL_SPEED_PX_PER_MS = 6;
const REVEAL_MIN_MS = 260;
const REVEAL_MAX_MS = 600;

// The colour-crossfade path has no wipe to pace against, so it uses the floor as
// its spine and global.css takes the icon and profile timings as fractions.
const FALLBACK_DURATION_MS = REVEAL_MIN_MS;

// How long .theme-transition stays on <html>. Nothing it drives runs past the
// spine, and the margin is not slack: removing a property from
// transition-property cancels a transition still running on it, which snaps.
const THEME_TRANSITION_HOLD = FALLBACK_DURATION_MS + 32;

// Backstop for a transition whose `finished` never settles, which would leave
// `transition: none !important` on the document until the next navigation.
const VIEW_TRANSITION_GRACE_MS = 2000;

// The wipe is built here rather than declared in global.css because a click
// mid-flight replaces it outright — see retarget() — which needs the Animation
// in hand. The icon and profile card stay in CSS, keyed off [data-theme], and
// are pulled into step through the lookup below.
const THEME_EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";

// Floor on a re-keyed span, so a barely-started wipe does not snap shut in three
// frames when it is sent back.
const RETARGET_MIN_MS = 180;

type ViewTransitionLike = {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition: () => void;
};

type ActiveTransition = {
  transition: ViewTransitionLike;
  /** Where the page was before this transition started. */
  from: ResolvedTheme;
  /** Where it heads while playing forward. */
  to: ResolvedTheme;
  /** +1 playing toward `to`, -1 retracting toward `from`. */
  direction: 1 | -1;
  /** Which theme the transition will land on as things stand. */
  outcome: ResolvedTheme;
  /** Origin of the wipe, and the radius that covers the furthest corner. */
  x: number;
  y: number;
  radius: number;
  /** Full-travel duration this gesture was paced at. */
  duration: number;
  /** The wipe. Null until `ready`, when the pseudo tree first exists. */
  reveal: Animation | null;
  /** Endpoints `reveal` is interpolating. Re-keying means these are not always
   *  0 and `radius`, and reading the circle's position back out depends on it. */
  fromRadius: number;
  toRadius: number;
  sequence: number;
};

/** The icon swap and profile card flip, which global.css still owns. */
function secondaryTransitionAnimations(): Animation[] {
  return document.getAnimations().filter((animation) => {
    const { effect } = animation;
    return (
      effect instanceof KeyframeEffect &&
      effect.pseudoElement?.startsWith("::view-transition") === true &&
      effect.pseudoElement !== "::view-transition-new(root)"
    );
  });
}

function circleAt(radius: number, record: ActiveTransition): string {
  return `circle(${radius}px at ${record.x}px ${record.y}px)`;
}

export function initThemeToggle(button: HTMLButtonElement): void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let sequence = 0;
  let active: ActiveTransition | null = null;
  // Stands in for an attribute not yet written: startViewTransition defers its
  // update callback, so a second click arriving before the first callback runs
  // would otherwise read the stale attribute and compute the same "next" theme.
  let pendingTheme: ResolvedTheme | null = null;

  const setLabel = (theme: ResolvedTheme) => {
    const label =
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  };
  setLabel(getRenderedTheme());

  // Invalidates any in-flight transition's cleanup, clears the timer and puts
  // <html> back to its resting classes.
  const resetTransition = () => {
    sequence += 1;
    active = null;

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    const root = document.documentElement;
    root.classList.remove("theme-transition", "theme-view-transition");
    // classList.remove leaves class="" behind once the last one goes.
    if (root.className === "") root.removeAttribute("class");
  };

  const applyTheme = (theme: ResolvedTheme) => {
    applyResolvedTheme(theme);
    pendingTheme = theme;
    persistTheme(theme);
    setLabel(theme);
  };

  /**
   * A retraction ends when the circle arrives back at the button. Left alone the
   * transition would end itself there and tear the pseudo tree down, exposing a
   * document still carrying the theme the visitor just backed out of.
   *
   * Order matters: end the transition first, then put the document back. Both
   * run in the same task so no frame is shown in between either way, but writing
   * data-theme while the pseudo tree is live would move
   * `view-transition-name: theme-icon` from one icon to the other mid-capture.
   *
   * Re-armed after every re-key, since each one is a new Animation with a new
   * `finished`. A forward arrival falls through to the transition's own end.
   */
  const watchRetraction = (record: ActiveTransition) => {
    const { reveal } = record;
    if (!reveal) return;

    void reveal.finished.then(
      () => {
        if (sequence !== record.sequence) return;
        if (record.direction !== -1) return;
        record.transition.skipTransition();
        applyTheme(record.from);
      },
      () => {}
    );
  };

  /**
   * Re-key the wipe from wherever the circle is to wherever the gesture is now
   * headed, and pull the icon and profile card into step with it.
   *
   * Deliberately not `playbackRate = -1`. Rewinding replays the same curve
   * backwards, and this one is a front-loaded ease-out — reversed, that is an
   * ease-in, so the circle hesitates and then slams into the button at full
   * speed. Re-keying lets the ease-out settle it instead.
   */
  const retarget = (record: ActiveTransition) => {
    const previous = record.reveal;
    if (!previous) return;

    // Post-easing, so this is the circle's real radius at this instant rather
    // than where a linear read of the clock would put it.
    const eased = previous.effect?.getComputedTiming().progress;
    const progress =
      typeof eased === "number" ? eased : record.direction === 1 ? 0 : 1;
    const fromRadius =
      record.fromRadius + progress * (record.toRadius - record.fromRadius);
    const toRadius = record.direction === 1 ? record.radius : 0;

    // Pace what is left at the speed of the whole gesture, so a wipe caught
    // near the corner takes longer to come back than one caught off the button.
    const travel = Math.abs(toRadius - fromRadius) / (record.radius || 1);
    const span = Math.min(
      record.duration,
      Math.max(RETARGET_MIN_MS, record.duration * travel)
    );

    const next = document.documentElement.animate(
      { clipPath: [circleAt(fromRadius, record), circleAt(toRadius, record)] },
      {
        duration: span,
        easing: THEME_EASE,
        fill: "both",
        pseudoElement: "::view-transition-new(root)",
      }
    );

    // Create before cancelling: `fill: both` on the outgoing animation is the
    // only thing holding the clip, so dropping it first would leave the new
    // theme briefly unclipped.
    previous.cancel();
    record.reveal = next;
    record.fromRadius = fromRadius;
    record.toRadius = toRadius;

    // Each of these has its own duration, so each gets its own rate, sized to
    // reach its end exactly as the circle reaches its target.
    for (const animation of secondaryTransitionAnimations()) {
      const total = Number(animation.effect?.getComputedTiming().duration ?? 0);
      const time = animation.currentTime;
      const elapsed = typeof time === "number" ? time : 0;
      const remaining = record.direction === 1 ? total - elapsed : elapsed;
      if (remaining <= 0) continue;

      animation.playbackRate = (record.direction * remaining) / span;
      // Changing direction on an animation parked at either end leaves it
      // finished; without this the transition hangs until the backstop.
      if (animation.playState === "finished") animation.play();
    }

    watchRetraction(record);
  };

  /** A click while the wipe is on screen: turn the gesture around. */
  const steer = (record: ActiveTransition) => {
    record.direction = record.direction === 1 ? -1 : 1;
    record.outcome = record.direction === 1 ? record.to : record.from;
    pendingTheme = record.outcome;

    // Clicked between startViewTransition and ready, before the wipe exists.
    // The direction is recorded above; the ready handler applies it.
    if (record.reveal) retarget(record);
  };

  // While a view transition runs the document is unreachable by pointer:
  // document.elementFromPoint at this button's centre returns `path` when idle
  // and `HTML` mid-transition. Captured content is skipped for hit-testing, not
  // only for painting, so the button cannot receive a click during its own wipe
  // and its own listener alone can never steer. The click still fires — it just
  // targets <html> — so resolve it by geometry while a transition is live.
  // Capturing at the window runs first, and stopping propagation keeps the
  // button's own handler from handling the same click twice.
  window.addEventListener(
    "click",
    (event) => {
      if (!active) return;
      // Keyboard activation reports 0,0 and is dispatched at the button.
      if (event.detail === 0) return;

      const rect = button.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) return;

      event.stopPropagation();
      steer(active);
    },
    true
  );

  button.addEventListener("click", (event) => {
    const root = document.documentElement;

    // Mouse clicks during a transition are handled by the window listener
    // above; this is the keyboard path, which is dispatched at the button and
    // so still arrives here.
    if (active) {
      steer(active);
      return;
    }

    const rect = button.getBoundingClientRect();
    const keyboardActivation = event.detail === 0;
    const x = keyboardActivation ? rect.left + rect.width / 2 : event.clientX;
    const y = keyboardActivation ? rect.top + rect.height / 2 : event.clientY;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const fromTheme = pendingTheme ?? getRenderedTheme();
    const toTheme: ResolvedTheme = fromTheme === "dark" ? "light" : "dark";

    pendingTheme = toTheme;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    // Only the wipe travels, so only the wipe is paced by distance. Both paths
    // hand the same variable to CSS, which derives the icon and profile timings.
    const duration = reducedMotion
      ? FALLBACK_DURATION_MS
      : Math.round(
          Math.min(
            REVEAL_MAX_MS,
            Math.max(REVEAL_MIN_MS, radius / REVEAL_SPEED_PX_PER_MS)
          )
        );

    root.style.setProperty("--theme-x", `${x}px`);
    root.style.setProperty("--theme-y", `${y}px`);
    root.style.setProperty("--theme-radius", `${radius}px`);
    root.style.setProperty("--theme-duration", `${duration}ms`);

    const startViewTransition = (
      document as Document & {
        startViewTransition?: (cb: () => void) => ViewTransitionLike;
      }
    ).startViewTransition;

    // Reduced motion falls through to the colour crossfade below rather than
    // committing instantly. The wipe never starts and global.css pins the icon
    // and profile card, but the page still crossfades instead of cutting
    // between near-white and near-black in a single frame.
    if (!reducedMotion && typeof startViewTransition === "function") {
      resetTransition();

      const mySequence = sequence;
      root.classList.add("theme-view-transition");

      try {
        // Mutate synchronously so View Transitions captures the new theme.
        const transition = startViewTransition.call(document, () =>
          applyTheme(toTheme)
        );

        const record: ActiveTransition = {
          transition,
          from: fromTheme,
          to: toTheme,
          direction: 1,
          outcome: toTheme,
          x,
          y,
          radius,
          duration,
          reveal: null,
          fromRadius: 0,
          toRadius: radius,
          sequence: mySequence,
        };
        active = record;

        // `finished` settling is the normal release; the timer is the backstop.
        // Whichever fires first wins, and the sequence check makes the loser a
        // no-op — as it does for a transition superseded by a new click.
        const release = () => {
          if (sequence !== mySequence) return;
          // Whichever direction the visitor left it pointing is the answer.
          applyTheme(record.outcome);
          resetTransition();
        };

        transition.ready.then(
          () => {
            if (sequence !== mySequence) return;

            // `ready` is the last moment before the transition's first frame is
            // rendered, so building the wipe here never flashes it unclipped.
            record.reveal = root.animate(
              { clipPath: [circleAt(0, record), circleAt(radius, record)] },
              {
                duration,
                easing: THEME_EASE,
                fill: "both",
                pseudoElement: "::view-transition-new(root)",
              }
            );

            if (record.direction === -1) retarget(record);
          },
          () => {
            // Aborted, a hidden tab being the usual cause. Nothing to steer,
            // but `finished` still resolves, so release() commits the outcome.
          }
        );

        void transition.finished.then(release, release);
        timer = setTimeout(release, duration + VIEW_TRANSITION_GRACE_MS);
        return;
      } catch {
        active = null;
        root.classList.remove("theme-view-transition");
      }
    }

    // A click while the crossfade is already running keeps the class in place on
    // purpose: CSS transitions retarget from their current computed value, so
    // the colours turn around and walk back. Removing and re-adding the class
    // would cancel them and snap to the end first.
    if (root.classList.contains("theme-transition")) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    } else {
      resetTransition();
      root.classList.add("theme-transition");
      void root.offsetWidth;
    }

    applyTheme(toTheme);

    timer = setTimeout(resetTransition, THEME_TRANSITION_HOLD);
  });

  // Keeps the label honest when the OS flips while the preference is "system".
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (!active) setLabel(getRenderedTheme());
    });
}
