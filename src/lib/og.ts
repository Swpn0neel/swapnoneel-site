import { siteConfig } from "@/lib/config";
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs/promises";
import path from "node:path";
import satori, { type SatoriOptions } from "satori";

/**
 * Open Graph cards, rendered at build time.
 *
 * Next generated these two ways: app/opengraph-image.tsx for the home card and
 * an `/api/og` edge function for everything else, reading title and description
 * off the query string. Both used next/og, which is satori + resvg underneath —
 * so this is the same renderer, called directly, with the results written to
 * disk as static PNGs. No function, no cold start, no per-request transcode.
 *
 * Trees are plain objects rather than JSX so this stays a .ts file.
 */

const WIDTH = 1200;
const HEIGHT = 630;

type Node = {
  type: string;
  props: Record<string, unknown> & { children?: Node | Node[] | string };
};

const el = (
  type: string,
  props: Record<string, unknown>,
  children?: Node | Node[] | string
): Node => ({ type, props: { ...props, ...(children ? { children } : {}) } });

let fontsPromise: Promise<SatoriOptions["fonts"]> | null = null;

/**
 * The variable woff2 the site serves cannot be used here — satori needs a
 * static font it can read glyph outlines from, which is why the two Inter TTFs
 * stayed in assets/fonts when the subsetting pipeline was deleted.
 */
function loadFonts(): Promise<SatoriOptions["fonts"]> {
  fontsPromise ??= (async () => {
    const dir = path.join(process.cwd(), "assets", "fonts");
    const [regular, semibold] = await Promise.all([
      fs.readFile(path.join(dir, "Inter-Regular.ttf")),
      fs.readFile(path.join(dir, "Inter-SemiBold.ttf")),
    ]);
    return [
      {
        name: "Inter",
        data: regular,
        weight: 400 as const,
        style: "normal" as const,
      },
      {
        name: "Inter",
        data: semibold,
        weight: 600 as const,
        style: "normal" as const,
      },
    ];
  })();
  return fontsPromise;
}

let avatarPromise: Promise<string> | null = null;

function loadAvatar(): Promise<string> {
  avatarPromise ??= fs
    .readFile(path.join(process.cwd(), "src", "assets", "img", "pfp.jpg"))
    .then((buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`);
  return avatarPromise;
}

/** The dotted texture and the soft glow, shared by both cards. */
function backdrop(): Node[] {
  return [
    el("div", {
      style: {
        position: "absolute",
        top: -200,
        left: -100,
        width: 700,
        height: 700,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)",
      },
    }),
    el("div", {
      style: {
        position: "absolute",
        inset: 0,
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      },
    }),
  ];
}

/** The home card: name, strapline and the avatar. */
async function homeCard(): Promise<Node> {
  const avatar = await loadAvatar();
  return el(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0a0a0a",
        padding: "72px 80px",
        fontFamily: "Inter",
        position: "relative",
      },
    },
    [
      ...backdrop(),
      el(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          },
        },
        [
          el(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 16,
                color: "#a3a3a3",
                fontSize: 28,
              },
            },
            "www.swapnoneel.site"
          ),
          el("img", {
            src: avatar,
            width: 140,
            height: 140,
            style: {
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.15)",
            },
          }),
        ]
      ),
      el(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 20 } },
        [
          el(
            "div",
            {
              style: {
                fontSize: 88,
                fontWeight: 600,
                color: "#fafafa",
                letterSpacing: "-3px",
                lineHeight: 1,
              },
            },
            siteConfig.person.displayName
          ),
          el(
            "div",
            {
              style: {
                fontSize: 34,
                color: "#a3a3a3",
                lineHeight: 1.4,
                maxWidth: 900,
              },
            },
            "software engineer — building scalable systems, writing about code, and shipping things on the internet."
          ),
        ]
      ),
    ]
  );
}

/** Every other card: a centred title over a description. */
function pageCard(title: string, description: string): Node {
  return el(
    "div",
    {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        fontFamily: "Inter",
        position: "relative",
      },
    },
    [
      ...backdrop(),
      el(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 60px",
            textAlign: "center",
          },
        },
        [
          el(
            "div",
            {
              style: {
                fontSize: 60,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#fafafa",
                lineHeight: 1.2,
                marginBottom: 16,
              },
            },
            title
          ),
          el(
            "div",
            {
              style: {
                fontSize: 28,
                color: "#a1a1aa",
                lineHeight: 1.5,
                maxWidth: "80%",
              },
            },
            description
          ),
          el(
            "div",
            {
              style: {
                marginTop: 40,
                fontSize: 20,
                color: "#52525b",
                letterSpacing: "0.05em",
              },
            },
            siteConfig.person.displayName
          ),
        ]
      ),
    ]
  );
}

export async function renderOgCard(
  card:
    | { variant: "home" }
    | { variant: "page"; title: string; description: string }
): Promise<Uint8Array> {
  const tree =
    card.variant === "home"
      ? await homeCard()
      : pageCard(card.title, card.description);
  const svg = await satori(tree as never, {
    width: WIDTH,
    height: HEIGHT,
    fonts: await loadFonts(),
  });
  return new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } })
    .render()
    .asPng();
}

/** The URL a page should advertise for its card. */
export function ogImagePath(key: string): string {
  return `/og/${key}.png`;
}
