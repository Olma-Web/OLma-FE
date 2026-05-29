import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://13.124.31.106/:path*",
      },
    ];
  },
};

export default nextConfig;
