import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js", "satori", "unpdf"],
  outputFileTracingIncludes: {
    "/api/**": ["./public/fonts/**"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }, { protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

export default nextConfig;
