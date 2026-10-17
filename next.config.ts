import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera HTML estático en out/ para servirlo desde Firebase Hosting
  output: "export",
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
