"use client";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { i18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

const CalBooking = dynamic(() =>
  import("@/components/cal-booking").then((m) => m.CalBooking)
);

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    if ("text" in error && typeof error.text === "string") {
      return error.text;
    }

    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    return JSON.stringify(error);
  }

  return String(error);
}

/** How long a terminal state sits in the button before it resets to idle. */
const RESET_DELAY: Record<"success" | "error", number> = {
  success: 4000,
  error: 5000,
};

type Status =
  | { type: "idle" | "sending" }
  // `announcement` is the fuller wording read out to screen readers and shown
  // on hover via `title`; the visible label comes from STATUS_LAYERS.
  | { type: "success" | "error"; announcement: string };

/**
 * Every state the button can show. All four are rendered into one grid cell
 * and crossfaded, so the outgoing and incoming labels animate past each other
 * instead of snapping.
 */
const STATUS_LAYERS = [
  {
    key: "idle",
    icon: <Send className="size-[1em] shrink-0" />,
    label: i18n.contactPage.sendMessage,
  },
  {
    key: "sending",
    icon: <Loader2 className="size-[1em] shrink-0 animate-spin" />,
    label: i18n.contactPage.sendingMessage,
  },
  {
    key: "success",
    icon: (
      <CheckCircle2 className="size-[1em] shrink-0 text-emerald-400 dark:text-emerald-600" />
    ),
    label: i18n.contactPage.messageSent,
  },
  {
    key: "error",
    icon: (
      <AlertCircle className="size-[1em] shrink-0 text-red-400 dark:text-red-600" />
    ),
    label: i18n.contactPage.errorLabel,
  },
] as const;

export default function ContactPage() {
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const isSubmitting = status.type === "sending";

  // Roll back to the default label so the button never sits on a stale result.
  useEffect(() => {
    if (status.type !== "success" && status.type !== "error") return;
    const timer = window.setTimeout(
      () => setStatus({ type: "idle" }),
      RESET_DELAY[status.type]
    );
    return () => window.clearTimeout(timer);
  }, [status]);

  // The button always shows the generic "Error"; the specific reason is
  // carried in `announcement` for the tooltip and the live region.
  const fail = (announcement: string) =>
    setStatus({ type: "error", announcement });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ type: "sending" });

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const { announcements } = i18n.contactPage;

    if (!name || !email || !subject || !message) {
      return fail(announcements.allFieldsRequired);
    }

    if (name.length > 100) {
      return fail(announcements.nameTooLong);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length > 255 || !emailRegex.test(email)) {
      return fail(announcements.invalidEmail);
    }

    if (subject.length > 150) {
      return fail(announcements.subjectTooLong);
    }

    if (message.length > 5000) {
      return fail(announcements.messageTooLong);
    }

    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error(i18n.contactPage.errors.credentialsMissing);
      }

      // Theme the email to match the site theme the visitor had when they
      // submitted: a dark-mode submission delivers a dark email, light stays
      // light. EmailJS substitutes these tokens into the template's inline
      // styles, so one template covers both themes (no conditionals needed).
      const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");

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

      const templateParams = {
        name,
        email,
        subject,
        message,
        theme_name: isDark ? "dark" : "light",
        ...theme,
      };

      const emailjs = await import("@emailjs/browser");
      await emailjs.default.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );
      setStatus({
        type: "success",
        announcement: i18n.contactPage.successMessage,
      });
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      // EmailJS rejects with EmailJSResponseStatus ({ status, text }), a plain
      // class rather than an Error subclass — the Next.js dev overlay can't
      // serialise it and prints a bare `{}`. Log the resolved text and status
      // instead so the failure is actually readable in the console.
      const httpStatus =
        typeof err === "object" && err !== null && "status" in err
          ? ` (status ${String(err.status)})`
          : "";
      const detail = getErrorMessage(err);
      console.error(`EmailJS Error${httpStatus}:`, detail);
      fail(`${i18n.contactPage.errors.sendFailedPrefix} ${detail}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {i18n.contactPage.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          {i18n.contactPage.intro}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              label={i18n.contactPage.labels.name}
              placeholder={i18n.contactPage.placeholders.name}
            />

            <Input
              id="email"
              name="email"
              type="email"
              required
              maxLength={255}
              label={i18n.contactPage.labels.email}
              placeholder={i18n.contactPage.placeholders.email}
            />
          </div>

          <Input
            id="subject"
            name="subject"
            type="text"
            required
            maxLength={150}
            label={i18n.contactPage.labels.subject}
            placeholder={i18n.contactPage.placeholders.subject}
          />

          <Textarea
            id="message"
            name="message"
            required
            maxLength={5000}
            rows={6}
            label={i18n.contactPage.labels.message}
            placeholder={i18n.contactPage.placeholders.message}
          />
        </div>

        {/* Natural width, as before. Every status label is kept no wider than
            "Send Message" (see i18n), so the button holds its size across
            states without needing a hardcoded width. The status colours are
            inverted against the usual dark: variants because the primary
            button's fill is itself inverted — near-black in light mode,
            near-white in dark. */}
        <Button
          type="submit"
          disabled={isSubmitting}
          // The visible label changes with status, but a control's accessible
          // name should stay its action. Status reaches assistive tech through
          // the live region instead.
          aria-label={i18n.contactPage.sendMessage}
          title={
            status.type === "success" || status.type === "error"
              ? status.announcement
              : undefined
          }
          className="w-full sm:w-auto"
        >
          <span className="grid">
            {/* Hidden but still laid out: reserves the width of the widest
                state so the button holds one size as its label changes, without
                hardcoding a pixel value that would drift if the copy changes.
                Both spans share one grid cell, so the cell takes the wider. */}
            <span
              aria-hidden="true"
              className="invisible col-start-1 row-start-1 flex items-center justify-center gap-2 leading-none"
            >
              <Send className="size-[1em] shrink-0" />
              {i18n.contactPage.sendMessage}
            </span>

            {/* The outgoing label falls away while the incoming one rises into
                place. The overshoot curve is the same one the profile card
                flip uses, which gives the tick and the alert a slight pop as
                they land. Reduced-motion users get this collapsed to ~0s by
                the global rule in globals.css. */}
            {STATUS_LAYERS.map((layer) => {
              const isActive = status.type === layer.key;
              return (
                <span
                  key={layer.key}
                  // Purely visual: the button carries a fixed aria-label and
                  // status is announced through the live region below, so the
                  // stacked layers must stay out of the accessibility tree
                  // entirely (otherwise they concatenate into the name).
                  aria-hidden="true"
                  className={cn(
                    // Tailwind v4 emits `translate`/`scale` as standalone CSS
                    // properties rather than folding them into `transform`, so
                    // they have to be named here or the movement snaps and only
                    // the fade animates.
                    //
                    // `leading-none` matters for icon alignment: the Button
                    // sets it too, but `text-sm` wins in the cascade and leaves
                    // a 24px line box around 16.8px text. Centring the icon on
                    // that taller box makes it sit visibly low, so the line box
                    // is tightened back to the font size here.
                    "col-start-1 row-start-1 flex items-center justify-center gap-2 leading-none transition-[opacity,translate,scale] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                    isActive
                      ? "translate-y-0 scale-100 opacity-100"
                      : "pointer-events-none translate-y-1 scale-90 opacity-0"
                  )}
                >
                  {layer.icon}
                  {layer.label}
                </span>
              );
            })}
          </span>
        </Button>

        {/* The button's own label is too terse to be the only signal, so the
            full wording is announced here instead. */}
        <span role="status" aria-live="polite" className="sr-only">
          {status.type === "success" || status.type === "error"
            ? status.announcement
            : ""}
        </span>
      </form>

      <div className="border-border -mt-2 border-t pt-8">
        <h2 className="mb-2 text-xl font-semibold tracking-tight">
          {i18n.contactPage.bookCall.title}
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          {i18n.contactPage.bookCall.description}
        </p>
        <CalBooking />
      </div>
    </div>
  );
}
