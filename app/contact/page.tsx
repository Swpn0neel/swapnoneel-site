"use client";

import { Input, Textarea } from "@/components/ui/input";
import {
  StatusButton,
  type StatusButtonStatus,
} from "@/components/ui/status-button";
import { checkEmail } from "@/lib/email";
import { i18n } from "@/lib/i18n";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

const CalBooking = dynamic(() =>
  import("@/components/cal-booking").then((m) => m.CalBooking)
);

const { submit, errors } = i18n.contactPage;

type ContactError = keyof typeof errors;

type FormState =
  | { status: "idle" | "pending" | "success" }
  | { status: "error"; error: ContactError; suggestion?: string };

/** How long a terminal state sits in the button before it resets to idle. */
const RESET_DELAY: Record<"success" | "error", number> = {
  success: 4000,
  error: 5000,
};

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
  status: StatusButtonStatus;
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
      return {
        status: "error",
        label: copy.label,
        announcement: copy.detail,
      };
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

export default function ContactPage() {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const view = present(state);

  // Roll back to the default label so the button never sits on a stale result.
  useEffect(() => {
    if (state.status !== "success" && state.status !== "error") return;
    const timer = window.setTimeout(
      () => setState({ status: "idle" }),
      RESET_DELAY[state.status]
    );
    return () => window.clearTimeout(timer);
  }, [state]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
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
    if (invalid) return setState({ status: "error", ...invalid });

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    if (!serviceId || !templateId || !publicKey) {
      return setState({ status: "error", error: "notConfigured" });
    }

    const renderedTheme = document.documentElement.dataset.theme;
    const isDark =
      renderedTheme === "dark" ||
      (renderedTheme !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
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

      {/* noValidate: the browser's own bubbles would otherwise pre-empt this
          form's error reporting for some failures and not others — `required`
          never reaches validate() at all, and `type="email"` waves through
          `a@b` while blocking `abc` with an unstyled popup. One validator, one
          place the result is shown. `type="email"` stays for the keyboard it
          gets on phones. */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="name"
              name="name"
              type="text"
              required
              maxLength={LIMITS.name}
              label={i18n.contactPage.labels.name}
              placeholder={i18n.contactPage.placeholders.name}
            />

            <Input
              id="email"
              name="email"
              type="email"
              required
              maxLength={LIMITS.email}
              label={i18n.contactPage.labels.email}
              placeholder={i18n.contactPage.placeholders.email}
            />
          </div>

          <Input
            id="subject"
            name="subject"
            type="text"
            required
            maxLength={LIMITS.subject}
            label={i18n.contactPage.labels.subject}
            placeholder={i18n.contactPage.placeholders.subject}
          />

          <Textarea
            id="message"
            name="message"
            required
            maxLength={LIMITS.message}
            rows={6}
            label={i18n.contactPage.labels.message}
            placeholder={i18n.contactPage.placeholders.message}
          />
        </div>

        <StatusButton
          type="submit"
          status={view.status}
          label={view.label}
          aria-label={submit.idle}
          title={view.announcement || undefined}
          className="w-full sm:w-(--status-button-width,auto)"
        />

        {/* The button's label is the terse form, so the full wording is
            announced here. */}
        <span role="status" aria-live="polite" className="sr-only">
          {view.announcement}
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
