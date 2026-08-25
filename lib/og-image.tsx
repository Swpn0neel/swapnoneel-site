import { siteConfig } from "@/lib/config";
import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

let cachedFonts:
  | [
      { name: string; data: Buffer; weight: 400; style: "normal" },
      { name: string; data: Buffer; weight: 600; style: "normal" },
      { name: string; data: Buffer; weight: 700; style: "normal" },
    ]
  | null = null;

async function loadOgFonts() {
  if (cachedFonts) return cachedFonts;
  try {
    const [regular, semiBold] = await Promise.all([
      readFile(join(process.cwd(), "assets/fonts/Inter-Regular.ttf")),
      readFile(join(process.cwd(), "assets/fonts/Inter-SemiBold.ttf")),
    ]);

    cachedFonts = [
      { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "Inter", data: semiBold, weight: 600 as const, style: "normal" as const },
      { name: "Inter", data: semiBold, weight: 700 as const, style: "normal" as const },
    ];
    return cachedFonts;
  } catch {
    return undefined;
  }
}

// Single renderer for all opengraph-image routes.
export async function renderOgImage(title: string, description?: string) {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#fafafa",
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              fontSize: 28,
              color: "#a1a1aa",
              lineHeight: 1.5,
              maxWidth: "80%",
            }}
          >
            {description}
          </div>
        ) : null}
        <div
          style={{
            marginTop: 40,
            fontSize: 20,
            color: "#52525b",
            letterSpacing: "0.05em",
            textTransform: "lowercase",
          }}
        >
          {siteConfig.person.displayName}
        </div>
      </div>
    </div>,
    fonts
      ? {
          ...OG_IMAGE_SIZE,
          fonts,
        }
      : OG_IMAGE_SIZE
  );
}
