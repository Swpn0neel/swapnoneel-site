"use client";

import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getCalApi } from "@calcom/embed-react";
import { Calendar } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface CalBookingProps {
  className?: string;
  customText?: string;
}

export default function CalBooking({ className, customText }: CalBookingProps) {
  const { theme, systemTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Initialize both namespaces independently so they maintain their own isolated iframes
    (async function () {
      const calDark = await getCalApi({
        namespace: siteConfig.calendar.namespaceDark,
      });
      calDark("ui", {
        theme: "dark",
        styles: { branding: { brandColor: "#ffffff" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });

      const calLight = await getCalApi({
        namespace: siteConfig.calendar.namespaceLight,
      });
      calLight("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = isClient && currentTheme === "dark";
  const activeNamespace = isDark
    ? siteConfig.calendar.namespaceDark
    : siteConfig.calendar.namespaceLight;
  const calConfig = JSON.stringify({ layout: "month_view" });

  if (customText) {
    return (
      <button
        suppressHydrationWarning
        data-cal-namespace={activeNamespace}
        data-cal-link={siteConfig.calendar.link}
        data-cal-config={calConfig}
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
      data-cal-config={calConfig}
      className="focus-visible:ring-ring bg-foreground text-background hover:bg-foreground/90 inline-flex h-8 items-center justify-center rounded-md px-4 text-sm font-medium whitespace-nowrap shadow transition-colors focus-visible:ring-1 focus-visible:outline-none"
    >
      <Calendar className="mr-2 h-4 w-4" />
      {i18n.calendar.defaultButton}
    </button>
  );
}
