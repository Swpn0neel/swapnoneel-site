import type { NextConfig } from "next";
import path from "path";

if (typeof global !== "undefined") {
  delete (global as any).localStorage;
}


const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    root: path.resolve("."),
  },
};

export default nextConfig;
