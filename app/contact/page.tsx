"use client";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { i18n } from "@/lib/i18n";
import { Loader2, Send } from "lucide-react";
import dynamic from "next/dynamic";
import React, { useState } from "react";

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

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !message) {
      setError(i18n.contactPage.errors.allFieldsRequired);
      setIsSubmitting(false);
      return;
    }

    if (name.length > 100) {
      setError(i18n.contactPage.errors.nameTooLong);
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length > 255 || !emailRegex.test(email)) {
      setError(i18n.contactPage.errors.invalidEmail);
      setIsSubmitting(false);
      return;
    }

    if (message.length > 5000) {
      setError(i18n.contactPage.errors.messageTooLong);
      setIsSubmitting(false);
      return;
    }

    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error(i18n.contactPage.errors.credentialsMissing);
      }

      const templateParams = {
        name,
        email,
        message,
      };

      const emailjs = await import("@emailjs/browser");
      await emailjs.default.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      console.error("EmailJS Error:", err);
      setError(
        `${i18n.contactPage.errors.sendFailedPrefix} ${getErrorMessage(err)}`
      );
    } finally {
      setIsSubmitting(false);
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

        {error && (
          <p className="rounded-sm bg-red-500/10 p-3 text-sm font-medium text-red-500">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-sm bg-emerald-500/10 p-3 text-sm font-medium text-emerald-500">
            {i18n.contactPage.successMessage}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-[1em] shrink-0 animate-spin" />
              {i18n.contactPage.sendingMessage}
            </>
          ) : (
            <>
              <Send className="size-[1em] shrink-0" />
              {i18n.contactPage.sendMessage}
            </>
          )}
        </Button>
      </form>

      <div className="border-border mt-12 border-t pt-8">
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
