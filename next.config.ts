import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false as any,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
