export const DEVICE_SIZES = [640, 960, 1280, 1536] as const;
export const MAX_WIDTH = 1536;
export const BLOG_WEBP_QUALITY = 100;
export const BLOG_AVIF_QUALITY = 70;
export const BLOG_AVIF_EFFORT = 6;
export const PROJECT_FORMATS = [
  { ext: "avif" as const, type: "image/avif", quality: 70, effort: 6 },
  { ext: "webp" as const, type: "image/webp", quality: 82, effort: 6 },
] as const;
