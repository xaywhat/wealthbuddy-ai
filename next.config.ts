import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for mobile builds
  output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
