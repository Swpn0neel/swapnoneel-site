"use client";

import {
  getRenderedTheme,
  getSystemTheme,
  type ResolvedTheme,
} from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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
// its spine and globals.css takes the icon and profile timings as fractions.
const FALLBACK_DURATION_MS = REVEAL_MIN_MS;

// How long .theme-transition stays on <html>. Nothing it drives runs past the
// spine, and the margin is not slack: removing a property from
// transition-property cancels a transition still running on it, which snaps.
const THEME_TRANSITION_HOLD = FALLBACK_DURATION_MS + 32;

// Backstop for a transition whose `finished` never settles, which would leave
// `transition: none !important` on the document until the next navigation.
const VIEW_TRANSITION_GRACE_MS = 2000;

// The wipe is built here rather than declared in globals.css because a click
// mid-flight replaces it outright — see retarget() — which needs the Animation
// in hand. The icon and profile card stay in CSS, keyed off [data-theme], and
// are pulled into step through the lookup below.
const THEME_EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";

// Floor on a re-keyed span, so a barely-started wipe does not snap shut in three
// frames when it is sent back.
const RETARGET_MIN_MS = 180;
const LARGE_DOCUMENT_NODE_COUNT = 2_500;

type ConnectionHints = {
  effectiveType?: string;
  saveData?: boolean;
};

type PerformanceNavigator = Navigator & {
  connection?: ConnectionHints;
  deviceMemory?: number;
};

function shouldUseColorCrossfade() {
  const performanceNavigator = navigator as PerformanceNavigator;
  const connection = performanceNavigator.connection;
  const lowPowerDevice =
    (performanceNavigator.deviceMemory !== undefined &&
      performanceNavigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2) ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g";

  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    connection?.saveData === true ||
    lowPowerDevice ||
    document.getElementsByTagName("*").length > LARGE_DOCUMENT_NODE_COUNT
  );
}

/** The icon swap and profile card flip, which globals.css still owns. */
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

type ActiveTransition = {
  transition: ViewTransition;
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

function circleAt(radius: number, record: ActiveTransition): string {
  return `circle(${radius}px at ${record.x}px ${record.y}px)`;
}

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceRef = useRef(0);
  const activeRef = useRef<ActiveTransition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Stands in for an attribute React has not written yet: startViewTransition
  // defers its update callback, so a second click arriving before the first
  // callback runs would otherwise read the stale attribute and compute the same
  // "next" theme.
  const pendingThemeRef = useRef<ResolvedTheme | null>(null);

  // Invalidates any in-flight transition's cleanup, clears the timer and puts
  // <html> back to its resting classes. Safe to call twice in a row, which
  // StrictMode's double-invoked effect cleanup does in development.
  const resetTransition = useCallback(() => {
    sequenceRef.current += 1;
    activeRef.current = null;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const root = document.documentElement;
    root.classList.remove("theme-transition", "theme-view-transition");
    delete root.dataset.themeCrossfade;
    root.style.removeProperty("--theme-fade-color");
    // classList.remove leaves class="" behind once the last one goes.
    if (root.className === "") root.removeAttribute("class");
  }, []);

  const applyTheme = useCallback(
    (theme: ResolvedTheme) => {
      document.documentElement.dataset.theme = theme;
      pendingThemeRef.current = theme;
      // Hand the preference back to "system" whenever the visitor lands on what
      // their OS already asks for, instead of pinning an explicit choice
      // forever. Without this the first click is a one-way door: a dark-OS
      // visitor who toggles to light and back is left on an explicit "dark"
      // that no longer follows the OS, and the media-query palette that renders
      // the no-script case is dead for them from then on.
      setTheme(theme === getSystemTheme() ? "system" : theme);
    },
    [setTheme]
  );

  // resolvedTheme is undefined until next-themes has read storage and matched
  // the system query, so the label starts generic and sharpens after mount.
  // Rendering it unconditionally would be a hydration mismatch — the server has
  // no idea which theme this visitor resolves to.
  useEffect(() => {
    setMounted(true);

    return resetTransition;
  }, [resetTransition]);

  // Once next-themes reports the change, the pending value has served its
  // purpose; holding it longer would make the next click compute from a stale
  // theme after an OS-driven switch under "system". A transition in flight owns
  // the value itself, so leave it alone until that resolves.
  useEffect(() => {
    if (activeRef.current) return;
    pendingThemeRef.current = null;
  }, [resolvedTheme]);

  const label = !mounted
    ? "Toggle theme"
    : resolvedTheme === "dark"
      ? "Switch to light theme"
      : "Switch to dark theme";

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
  const watchRetraction = useCallback(
    (record: ActiveTransition) => {
      const { reveal } = record;
      if (!reveal) return;

      void reveal.finished.then(
        () => {
          if (sequenceRef.current !== record.sequence) return;
          if (record.direction !== -1) return;
          record.transition.skipTransition();
          applyTheme(record.from);
        },
        () => {}
      );
    },
    [applyTheme]
  );

  /**
   * Re-key the wipe from wherever the circle is to wherever the gesture is now
   * headed, and pull the icon and profile card into step with it.
   *
   * Deliberately not `playbackRate = -1`. Rewinding replays the same curve
   * backwards, and this one is a front-loaded ease-out — reversed, that is an
   * ease-in, so the circle hesitates and then slams into the button at full
   * speed. Re-keying lets the ease-out settle it instead.
   */
  const retarget = useCallback(
    (record: ActiveTransition) => {
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
      // near the corner takes longer to come back than one caught off the
      // button.
      const travel = Math.abs(toRadius - fromRadius) / (record.radius || 1);
      const span = Math.min(
        record.duration,
        Math.max(RETARGET_MIN_MS, record.duration * travel)
      );

      const next = document.documentElement.animate(
        {
          clipPath: [circleAt(fromRadius, record), circleAt(toRadius, record)],
        },
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
        const total = Number(
          animation.effect?.getComputedTiming().duration ?? 0
        );
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
    },
    [watchRetraction]
  );

  /** A click while the wipe is on screen: turn the gesture around. */
  const steer = useCallback(
    (record: ActiveTransition) => {
      record.direction = record.direction === 1 ? -1 : 1;
      record.outcome = record.direction === 1 ? record.to : record.from;
      pendingThemeRef.current = record.outcome;

      // Clicked between startViewTransition and ready, before the wipe exists.
      // The direction is recorded above; the ready handler applies it.
      if (record.reveal) retarget(record);
    },
    [retarget]
  );

  // While a view transition runs the document is unreachable by pointer:
  // document.elementFromPoint at this button's centre returns `path` when idle
  // and `HTML` mid-transition. Captured content is skipped for hit-testing, not
  // only for painting, so the button cannot receive a click during its own wipe
  // and onClick alone can never steer. The click still fires — it just targets
  // <html> — so resolve it by geometry while a transition is live. Capturing at
  // the window runs before React's listener, and stopping propagation keeps
  // onClick from handling the same click twice on the paths that still get one.
  useEffect(() => {
    const onCapture = (event: globalThis.MouseEvent) => {
      const record = activeRef.current;
      const button = buttonRef.current;
      if (!record || !button) return;
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
      steer(record);
    };

    window.addEventListener("click", onCapture, true);
    return () => window.removeEventListener("click", onCapture, true);
  }, [steer]);

  const handleThemeChange = (event: MouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement;

    // Mouse clicks during a transition are handled by the window listener
    // above; this is the keyboard path, which is dispatched at the button and
    // so still arrives here.
    const active = activeRef.current;
    if (active) {
      steer(active);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const keyboardActivation = event.detail === 0;
    const x = keyboardActivation ? rect.left + rect.width / 2 : event.clientX;
    const y = keyboardActivation ? rect.top + rect.height / 2 : event.clientY;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const fromTheme = pendingThemeRef.current ?? getRenderedTheme();
    const toTheme: ResolvedTheme = fromTheme === "dark" ? "light" : "dark";

    pendingThemeRef.current = toTheme;

    const useColorCrossfade = shouldUseColorCrossfade();
    // Only the wipe travels, so only the wipe is paced by distance. Both paths
    // hand the same variable to CSS, which derives the icon and profile timings.
    const duration = useColorCrossfade
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

    // Reduced motion falls through to the colour crossfade below rather than
    // committing instantly. The wipe never starts and globals.css pins the icon
    // and profile card, but the page still crossfades instead of cutting
    // between near-white and near-black in a single frame.
    if (
      !useColorCrossfade &&
      typeof document.startViewTransition === "function"
    ) {
      resetTransition();

      const sequence = sequenceRef.current;
      root.classList.add("theme-view-transition");

      try {
        // Mutate synchronously so View Transitions captures the new theme.
        const transition = document.startViewTransition(() =>
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
          sequence,
        };
        activeRef.current = record;

        // `finished` settling is the normal release; the timer is the backstop.
        // Whichever fires first wins, and the sequence check makes the loser a
        // no-op — as it does for a transition superseded by a new click.
        const release = () => {
          if (sequenceRef.current !== sequence) return;
          // Whichever direction the visitor left it pointing is the answer.
          applyTheme(record.outcome);
          resetTransition();
        };

        transition.ready.then(
          () => {
            if (sequenceRef.current !== sequence) return;

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
        timerRef.current = setTimeout(
          release,
          duration + VIEW_TRANSITION_GRACE_MS
        );
        return;
      } catch {
        activeRef.current = null;
        root.classList.remove("theme-view-transition");
      }
    }

    // A click while the crossfade is already running keeps the class in place on
    // purpose: CSS transitions retarget from their current computed value, so
    // the colours turn around and walk back. Removing and re-adding the class
    // would cancel them and snap to the end first.
    if (root.classList.contains("theme-transition")) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Reversing a crossfade starts from its present opacity rather than
      // dropping the overlay. This retains the earlier click's no-hard-cut
      // guarantee while the new theme is applied below.
      delete root.dataset.themeCrossfade;
      void root.offsetWidth;
    } else {
      resetTransition();
      root.style.setProperty(
        "--theme-fade-color",
        getComputedStyle(document.body).backgroundColor
      );
      root.classList.add("theme-transition");
      void root.offsetWidth;
    }

    applyTheme(toTheme);
    root.dataset.themeCrossfade = "active";

    timerRef.current = setTimeout(resetTransition, THEME_TRANSITION_HOLD);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleThemeChange}
      className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 focus-visible:ring-ring relative flex items-center justify-center rounded-md p-2 transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={label}
      title={label}
    >
      <Sun className="theme-toggle-sun theme-toggle-icon h-4 w-4 scale-100 rotate-0 transition-all duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="theme-toggle-moon theme-toggle-icon absolute h-4 w-4 scale-0 rotate-90 transition-all duration-300 dark:scale-100 dark:rotate-0" />
    </button>
  );
}
