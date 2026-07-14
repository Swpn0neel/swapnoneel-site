"use client";

import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getCalApi } from "@calcom/embed-react";
import { Calendar } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

interface CalBookingProps {
  className?: string;
  customText?: string;
}

export function CalBooking({ className, customText }: CalBookingProps) {
  const { theme, systemTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [activeNamespace, setActiveNamespace] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;

  const initCal = useCallback(async () => {
    const isDark = currentTheme === "dark";
    const namespace = isDark
      ? siteConfig.calendar.namespaceDark
      : siteConfig.calendar.namespaceLight;

    if (activeNamespace === namespace && initialized) return;
    setActiveNamespace(namespace);

    const cal = await getCalApi({ namespace });
    cal("ui", {
      theme: isDark ? "dark" : "light",
      cssVarsPerTheme: {
        light: { "cal-brand": isDark ? "#ffffff" : "#000000" },
        dark: { "cal-brand": isDark ? "#ffffff" : "#000000" },
      },
      hideEventTypeDetails: false,
      layout: "month_view",
    });

    setInitialized(true);
  }, [currentTheme, initialized, activeNamespace]);

  useEffect(() => {
    if (!isClient) return;
    initCal();
  }, [isClient, initCal]);

  if (customText) {
    return (
      <button
        suppressHydrationWarning
        data-cal-namespace={activeNamespace}
        data-cal-link={siteConfig.calendar.link}
        data-cal-config={JSON.stringify({ layout: "month_view" })}
        className={className}
      >
        {customText}
      </button>
    );
  }

  return (
    <button
      suppressHydrationWarning
      data-cal-namespace={activeNamespace}
      data-cal-link={siteConfig.calendar.link}
      data-cal-config={JSON.stringify({ layout: "month_view" })}
      className="focus-visible:ring-ring bg-foreground text-background hover:bg-foreground/90 inline-flex h-9 items-center justify-center gap-2 rounded-sm px-4 text-sm leading-none font-medium whitespace-nowrap shadow transition-colors focus-visible:ring-1 focus-visible:outline-none"
    >
      <Calendar className="size-[1em] shrink-0" />
      {i18n.calendar.defaultButton}
    </button>
  );
}
