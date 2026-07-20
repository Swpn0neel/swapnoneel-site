"use client";

import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { Calendar } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useRef } from "react";

type CalApiPromise = ReturnType<
  (typeof import("@calcom/embed-react"))["getCalApi"]
>;

interface CalBookingProps {
  className?: string;
  customText?: string;
}

export function CalBooking({ className, customText }: CalBookingProps) {
  const { theme, systemTheme } = useTheme();
  const apiRef = useRef<{
    namespace: string;
    promise: CalApiPromise;
  } | null>(null);

  const currentTheme = theme === "system" ? systemTheme : theme;

  const initCal = useCallback(async () => {
    const isDark = currentTheme === "dark";
    const namespace = isDark
      ? siteConfig.calendar.namespaceDark
      : siteConfig.calendar.namespaceLight;

    if (apiRef.current?.namespace === namespace) {
      return apiRef.current.promise;
    }

    const promise = import("@calcom/embed-react")
      .then(({ getCalApi }) => getCalApi({ namespace }))
      .then((cal) => {
        cal("ui", {
          theme: isDark ? "dark" : "light",
          cssVarsPerTheme: {
            light: { "cal-brand": isDark ? "#ffffff" : "#000000" },
            dark: { "cal-brand": isDark ? "#ffffff" : "#000000" },
          },
          hideEventTypeDetails: false,
          layout: "month_view",
        });
        return cal;
      });

    apiRef.current = { namespace, promise };
    return promise;
  }, [currentTheme]);

  const handleClick = useCallback(async () => {
    const cal = await initCal();
    cal("modal", {
      calLink: siteConfig.calendar.link,
      config: { layout: "month_view" },
    });
  }, [initCal]);

  const warmCal = useCallback(() => {
    void initCal();
  }, [initCal]);

  if (customText) {
    return (
      <button
        suppressHydrationWarning
        type="button"
        onPointerEnter={warmCal}
        onFocus={warmCal}
        onClick={handleClick}
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
      onClick={handleClick}
      className="focus-visible:ring-ring bg-foreground text-background hover:bg-foreground/90 inline-flex h-9 w-full items-center justify-center gap-2 rounded-sm px-4 text-sm leading-none font-medium whitespace-nowrap shadow transition-colors focus-visible:ring-1 focus-visible:outline-none sm:w-auto"
    >
      <Calendar className="size-[1em] shrink-0" />
      {i18n.calendar.defaultButton}
    </button>
  );
}
