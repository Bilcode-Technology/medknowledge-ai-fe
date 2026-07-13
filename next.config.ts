import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Dev-only: `npm run dev` serves this app standalone on :3000, without nginx's
  // BFF routing (docker/nginx/default.conf in medknowledge-ai-be) in front of it.
  // In production nginx intercepts /api before it ever reaches this app, so this
  // rewrite is dead code there — it only exists to make local iteration possible.
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];

    return [{ source: "/api/:path*", destination: "http://localhost:8080/api/:path*" }];
  },
};

export default nextConfig;
