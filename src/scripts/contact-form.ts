import { checkEmail } from "@/lib/email";
import { i18n } from "@/lib/i18n";
import { getRenderedTheme } from "@/lib/theme";

/**
 * Vanilla port of app/contact/page.tsx plus components/ui/status-button.tsx.
 *
 * The submit button morphs between states: its width animates to whatever the
 * new label needs while the old frame slides out and the new one slides in.
 * React did that by keeping a short list of frames in state; here the frames
 * are DOM nodes appended and removed directly, which is the same thing without
 * a render pass.
 */

const { submit, errors } = i18n.contactPage;

type Status = "idle" | "pending" | "success" | "error";
type ContactError = keyof typeof errors;
type FormState =
  | { status: "idle" | "pending" | "success" }
  | { status: "error"; error: ContactError; suggestion?: string };

/** How long a terminal state sits in the button before it resets to idle. */
const RESET_DELAY: Record<"success" | "error", number> = {
  success: 4000,
  error: 5000,
};
/** Matches the frame exit animation. */
const EXIT_MS = 300;

const LIMITS = { name: 100, email: 254, subject: 150, message: 5000 };
type Fields = Record<"name" | "email" | "subject" | "message", string>;

/** A failure, plus the corrected domain when we can name one. */
type Failure = { error: ContactError; suggestion?: string };

/** First failing rule wins, in the order a reader would meet the fields. */
function validate(fields: Fields): Failure | null {
  if (Object.values(fields).some((value) => !value))
    return { error: "emptyFields" };
  if (fields.name.length > LIMITS.name) return { error: "nameTooLong" };

  const email = checkEmail(fields.email);
  if (email?.kind === "malformed") return { error: "invalidEmail" };
  if (email?.kind === "typo")
    return { error: "emailTypo", suggestion: email.suggestion };

  if (fields.subject.length > LIMITS.subject)
    return { error: "subjectTooLong" };
  if (fields.message.length > LIMITS.message)
    return { error: "messageTooLong" };
  return null;
}

function present(state: FormState): {
  status: Status;
  label: string;
  announcement: string;
} {
  switch (state.status) {
    case "idle":
      return { status: "idle", label: submit.idle, announcement: "" };
    case "pending":
      return { status: "pending", label: submit.pending, announcement: "" };
    case "success":
      return {
        status: "success",
        label: submit.success.label,
        announcement: submit.success.detail,
      };
    case "error": {
      const copy = state.suggestion
        ? i18n.contactPage.emailSuggestion(state.suggestion)
        : errors[state.error];
      return { status: "error", label: copy.label, announcement: copy.detail };
    }
  }
}

function describe(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    if ("text" in error && typeof error.text === "string") return error.text;
    if ("message" in error && typeof error.message === "string")
      return error.message;
    return JSON.stringify(error);
  }
  return String(error);
}

export function initContactForm(form: HTMLFormElement): void {
  const button = form.querySelector<HTMLButtonElement>("[data-status-button]");
  const announcer = form.querySelector<HTMLElement>("[data-form-announce]");
  const iconTemplates = form.querySelector<HTMLElement>("[data-status-icons]");
  if (!button || !announcer || !iconTemplates) return;

  const icons: Record<Status, string> = {
    idle: iconTemplates.querySelector('[data-icon="idle"]')?.innerHTML ?? "",
    pending:
      iconTemplates.querySelector('[data-icon="pending"]')?.innerHTML ?? "",
    success:
      iconTemplates.querySelector('[data-icon="success"]')?.innerHTML ?? "",
    error: iconTemplates.querySelector('[data-icon="error"]')?.innerHTML ?? "",
  };

  let resetTimer: number | null = null;
  let measured = false;

  const makeFrame = (status: Status, label: string) => {
    const frame = document.createElement("span");
    frame.setAttribute("aria-hidden", "true");
    frame.className =
      "flex items-center gap-2 px-4 leading-none relative shrink-0 status-frame-in";
    frame.innerHTML = `${icons[status]}<span>${label}</span>`;
    return frame;
  };

  function render(state: FormState) {
    const view = present(state);
    const previous = button!.querySelector<HTMLElement>(".status-frame-in");
    const next = makeFrame(view.status, view.label);

    // Anything still on its way out from an earlier transition goes now. Two
    // state changes closer together than EXIT_MS would otherwise leave a frame
    // stacked in the button forever — every label the button had ever shown,
    // all rendered at once.
    for (const stale of button!.querySelectorAll(".status-frame-out")) {
      stale.remove();
    }

    if (previous) {
      previous.classList.remove("status-frame-in", "relative", "shrink-0");
      previous.classList.add("status-frame-out");
      // Each outgoing frame owns its own removal. A single shared timer was the
      // bug: each new transition cleared the pending one, so the frame it was
      // going to remove stayed behind.
      window.setTimeout(() => previous.remove(), EXIT_MS);
    }

    button!.appendChild(next);
    // Width follows the live frame, so the button grows and shrinks with its
    // own label instead of being sized for the longest one.
    button!.style.setProperty("--status-button-width", `${next.offsetWidth}px`);
    if (!measured) {
      measured = true;
      button!.dataset.measured = "true";
    }

    button!.disabled = view.status === "pending";
    // The button's label is the terse form, so the full wording is announced.
    announcer!.textContent = view.announcement;
  }

  function setState(state: FormState) {
    render(state);
    if (resetTimer !== null) window.clearTimeout(resetTimer);
    if (state.status !== "success" && state.status !== "error") return;
    // Roll back to the default label so the button never sits on a stale result.
    resetTimer = window.setTimeout(() => {
      resetTimer = null;
      render({ status: "idle" });
    }, RESET_DELAY[state.status]);
  }

  render({ status: "idle" });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setState({ status: "pending" });

    const data = new FormData(form);
    const read = (key: keyof Fields) => String(data.get(key) ?? "").trim();
    const fields: Fields = {
      name: read("name"),
      email: read("email"),
      subject: read("subject"),
      message: read("message"),
    };

    const invalid = validate(fields);
    if (invalid) {
      setState({ status: "error", ...invalid });
      return;
    }

    const serviceId = import.meta.env.PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY;
    if (!serviceId || !templateId || !publicKey) {
      setState({ status: "error", error: "notConfigured" });
      return;
    }

    const isDark = getRenderedTheme() === "dark";
    const theme = isDark
      ? {
          pageBg: "#000000",
          cardBg: "#121212",
          border: "#262626",
          heading: "#fafafa",
          body: "#a3a3a3",
          subtle: "#6b6b6b",
          quoteBg: "#1a1a1a",
          accent: "#fafafa",
          btnBorder: "#333333",
        }
      : {
          pageBg: "#f4f4f5",
          cardBg: "#ffffff",
          border: "#e5e5e5",
          heading: "#0a0a0a",
          body: "#525252",
          subtle: "#9a9a9a",
          quoteBg: "#fafafa",
          accent: "#0a0a0a",
          btnBorder: "#d4d4d4",
        };

    try {
      const emailjs = await import("@emailjs/browser");
      await emailjs.default.send(
        serviceId,
        templateId,
        { ...fields, theme_name: isDark ? "dark" : "light", ...theme },
        publicKey
      );
      setState({ status: "success" });
      form.reset();
    } catch (error: unknown) {
      const httpStatus =
        typeof error === "object" && error !== null && "status" in error
          ? ` (status ${String(error.status)})`
          : "";
      console.error(`EmailJS Error${httpStatus}:`, describe(error));
      setState({ status: "error", error: "sendFailed" });
    }
  });
}
