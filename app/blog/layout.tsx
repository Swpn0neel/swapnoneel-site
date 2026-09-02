import { geistMono } from "@/lib/fonts";
import type { ReactNode } from "react";

// The blog is the only part of the site that sets monospace: code blocks,
// inline code, the narrator's timecodes and the year-count badges. Mounting
// Geist Mono here rather than in the root layout confines its preload to these
// routes; `mono-scope` is what points --font-mono at the variable this class
// defines (see app/styles/base.css). A plain block wrapper, so it changes no
// layout of the pages inside it.
export default function BlogLayout({ children }: { children: ReactNode }) {
  return <div className={`${geistMono.variable} mono-scope`}>{children}</div>;
}
