import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Trust proxy headers from Cloudflare
  experimental: {
    // Enable server actions
  },

  // Allow images from any domain (for external URLs)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
