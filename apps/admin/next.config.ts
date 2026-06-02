import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@cp7/core", "@cp7/ui"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig
