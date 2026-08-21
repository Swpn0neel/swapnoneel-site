"use client";

import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getRenderedTheme } from "@/lib/theme";
import { Calendar } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

type CalApiFunction = (action: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    Cal?: {
      (action?: string, ...args: unknown[]): void;
      ns?: Record<string, CalApiFunction>;
      loaded?: boolean;
      q?: unknown[][];
    };
  }
}

let loadPromise: Promise<void> | null = null;

function ensureCalLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Cal && window.Cal.loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    (function (C: Window, A: string, L: string) {
      const p = function (a: unknown, ar: unknown) {
        ((a as { q?: unknown[] }).q = ((a as { q?: unknown[] }).q || [])).push(ar);
      };
      const d = C.document;
      C.Cal =
        C.Cal ||
        function (...args: unknown[]) {
          const cal = C.Cal!;
          const ar = args;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            const s = d.createElement("script");
            s.src = A;
            s.async = true;
            s.onload = () => resolve();
            d.head.appendChild(s);
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function (...apiArgs: unknown[]) {
              p(api, apiArgs);
            };
            const namespace = ar[1] as string;
            (api as unknown as { q: unknown[] }).q = [];
            if (typeof namespace === "string") {
              cal.ns![namespace] = cal.ns![namespace] || (api as CalApiFunction);
              p(cal.ns![namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else {
              p(cal, ar);
            }
            return;
          }
          p(cal, ar);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    // Trigger script append immediately
    window.Cal?.();
  });

  return loadPromise;
}

async function getCalApi(namespace: string): Promise<CalApiFunction> {
  await ensureCalLoaded();
  const cal = window.Cal;
  if (!cal) {
    throw new Error("Cal embed script unavailable");
  }
  cal("init", namespace, { origin: "https://cal.com" });
  cal("initNamespace", namespace);
  return (cal.ns?.[namespace] || cal) as CalApiFunction;
}

interface CalBookingProps {
  className?: string;
  customText?: string;
}

export function CalBooking({ className, customText }: CalBookingProps) {
  const { resolvedTheme } = useTheme();

  const getThemeInfo = useCallback(() => {
    const isClient = typeof window !== "undefined";
    const rendered = isClient
      ? getRenderedTheme()
      : resolvedTheme === "light"
        ? "light"
        : "dark";
    const isDark = rendered === "dark";

    return {
      isDark,
      namespace: isDark
        ? siteConfig.calendar.namespaceDark
        : siteConfig.calendar.namespaceLight,
      theme: rendered,
      calBrand: isDark ? "#ffffff" : "#000000",
    };
  }, [resolvedTheme]);

  const openCalModal = useCallback(async () => {
    const { namespace, theme, calBrand } = getThemeInfo();
    const cal = await getCalApi(namespace);
    cal("ui", {
      theme,
      cssVarsPerTheme: {
        light: { "cal-brand": calBrand },
        dark: { "cal-brand": calBrand },
      },
      hideEventTypeDetails: false,
      layout: "month_view",
    });
    cal("modal", {
      calLink: siteConfig.calendar.link,
      config: {
        layout: "month_view",
        theme,
      },
    });
  }, [getThemeInfo]);

  const warmCal = useCallback(() => {
    const { namespace } = getThemeInfo();
    void ensureCalLoaded().then(() => {
      if (window.Cal) {
        window.Cal("init", namespace, { origin: "https://cal.com" });
        window.Cal("initNamespace", namespace);
      }
    });
  }, [getThemeInfo]);

  if (customText) {
    return (
      <button
        suppressHydrationWarning
        type="button"
        onPointerEnter={warmCal}
        onFocus={warmCal}
        onClick={openCalModal}
        className={className}
      >
        {customText}
      </button>
    );
  }

  return (
    <button
      suppressHydrationWarning
      type="button"
      onPointerEnter={warmCal}
      onFocus={warmCal}
      onClick={openCalModal}
      className="focus-visible:ring-ring bg-foreground text-background hover:bg-foreground/90 inline-flex h-9 w-full items-center justify-center gap-2 rounded-sm px-4 text-sm leading-none font-medium whitespace-nowrap shadow transition-colors focus-visible:ring-1 focus-visible:outline-none sm:w-auto"
    >
      <Calendar className="size-[1em] shrink-0" />
      {i18n.calendar.defaultButton}
    </button>
  );
}
