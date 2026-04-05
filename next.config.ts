import type { NextConfig } from "next";

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
};

export default nextConfig;
