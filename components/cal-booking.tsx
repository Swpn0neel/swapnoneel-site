"use client";

import { getCalApi } from "@calcom/embed-react";
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { useTheme } from "next-themes";

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
      const calDark = await getCalApi({ namespace: "dark-booking" });
      calDark("ui", {
        theme: "dark",
        styles: { branding: { brandColor: "#ffffff" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });

      const calLight = await getCalApi({ namespace: "light-booking" });
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
  const activeNamespace = isDark ? "dark-booking" : "light-booking";
  
  const calConfig = JSON.stringify({ layout: "month_view" });

  if (customText) {
    return (
      <button
        suppressHydrationWarning
        data-cal-namespace={activeNamespace}
        data-cal-link="swapnoneel/30min"
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
      data-cal-link="swapnoneel/30min"
      data-cal-config={calConfig}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-foreground text-background shadow hover:bg-foreground/90 h-8 px-4"
    >
      <Calendar className="mr-2 h-4 w-4" />
      Book 30 min meeting
    </button>
  );
}
