import type { APIRoute, GetStaticPaths } from "astro";
import { renderOgCard } from "../../lib/og";
import { listOgCards, type OgCard } from "../../lib/og-cards";

/**
 * Open Graph cards as static PNGs.
 *
 * Replaces both app/opengraph-image.tsx and the /api/og edge function. Every
 * card is rendered once at build; nothing is generated per request.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const cards = await listOgCards();
  return cards.map((card) => ({ params: { key: card.key }, props: { card } }));
};

export const GET: APIRoute = async ({ props }) => {
  const { card } = props as { card: OgCard };
  const png = await renderOgCard(
    card.variant === "home"
      ? { variant: "home" }
      : { variant: "page", title: card.title, description: card.description }
  );

  return new Response(png as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
