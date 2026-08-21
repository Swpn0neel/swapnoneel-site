"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

/**
 * Marks a nav link's label while the navigation it started is still in flight.
 * The style behind [data-nav-pending] (components.css) holds still for 150ms,
 * so a prefetched, near-instant navigation never shows it — it surfaces only
 * when a click is genuinely waiting on the network, which is exactly the
 * moment a visitor starts doubting the click registered.
 *
 * Must be rendered inside the <Link> it reports on: useLinkStatus reads the
 * nearest ancestor Link.
 */
export function NavPendingLabel({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return <span data-nav-pending={pending || undefined}>{children}</span>;
}
