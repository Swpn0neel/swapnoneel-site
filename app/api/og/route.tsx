import { siteConfig } from "@/lib/config";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || siteConfig.person.fullName;
  const description =
    searchParams.get("description") || siteConfig.metadata.description;

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
    {
      width: 1200,
      height: 630,
    }
  );
}
