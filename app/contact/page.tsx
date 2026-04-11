"use client";

import CalBooking from "@/components/cal-booking";
import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import emailjs from "@emailjs/browser";
import { Loader2, Send } from "lucide-react";
import React, { useState } from "react";

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

    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error(i18n.contactPage.errors.credentialsMissing);
      }

      const templateParams = {
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message"),
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);
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
          {i18n.contactPage.intro}{" "}
          <a href={`mailto:${siteConfig.person.email}`} className="underline">
            {siteConfig.person.email}
          </a>{" "}
          {i18n.contactPage.outro}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="mb-9 text-sm font-medium">
              {i18n.contactPage.labels.name}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="border-input focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:h-10"
              placeholder={i18n.contactPage.placeholders.name}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {i18n.contactPage.labels.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="border-input focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:h-10"
              placeholder={i18n.contactPage.placeholders.email}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              {i18n.contactPage.labels.message}
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              className="border-input focus-visible:ring-ring flex w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={i18n.contactPage.placeholders.message}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-500/10 p-3 text-sm font-medium text-red-500">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md bg-emerald-500/10 p-3 text-sm font-medium text-emerald-500">
            {i18n.contactPage.successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-visible:ring-ring bg-foreground text-background hover:bg-foreground/90 inline-flex h-8 items-center justify-center rounded-md px-4 text-sm font-medium whitespace-nowrap shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {i18n.contactPage.sendingMessage}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {i18n.contactPage.sendMessage}
            </>
          )}
        </button>
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
