import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "https://preview-chat-dec442b9-ba4e-416d-86e3-5e80d99bf9a7.space-z.ai",
    "http://preview-chat-dec442b9-ba4e-416d-86e3-5e80d99bf9a7.space-z.ai",
    ".space-z.ai",
  ],
};

export default nextConfig;