"use client";

import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import { Loader2, Send } from "lucide-react";
import CalBooking from "@/components/cal-booking";

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
        throw new Error("EmailJS credentials are not configured in environment variables.");
      }

      const templateParams = {
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message"),
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      console.error("EmailJS Error:", err);
      const errorMessage = err?.text || err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err));
      setError(`Failed to send: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
        <p className="text-muted-foreground text-sm">
          Have a question or want to work together? I'm currently available for freelance work and I'm also open to full-time opportunities. You can reach out to me at {" "}
        <a href="mailto:swapnoneelsaha111@gmail.com" className="underline">
          swapnoneelsaha111@gmail.com
        </a>{" "} or by using the form below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium mb-9">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="flex w-full md:h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              placeholder="Your Name"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="flex w-full md:h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y"
              placeholder="How can I help you?"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 font-medium bg-red-500/10 p-3 rounded-md">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-500 font-medium bg-emerald-500/10 p-3 rounded-md">
            Message sent successfully! I&apos;ll get back to you soon.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-foreground text-background shadow hover:bg-foreground/90 h-8 px-4 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </>
          )}
        </button>
      </form>

      <div className="pt-8 mt-12 border-t border-border">
        <h2 className="text-xl font-semibold tracking-tight mb-2">Book a Call</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Prefer to chat directly? Let's hop on a 30-minute discovery call to discuss your project or ideas.
        </p>
        <CalBooking />
      </div>
    </div>
  );
}
