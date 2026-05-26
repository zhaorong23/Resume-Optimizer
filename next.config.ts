import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "word-extractor",
    "unpdf",
    "tesseract.js",
    "@napi-rs/canvas",
  ],
};

export default nextConfig;
