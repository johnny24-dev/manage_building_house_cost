import type { NextConfig } from "next";
import withPWA from "next-pwa";
import runtimeCaching from "next-pwa/cache";

const withPWAFeature = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/],
});

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  compiler: {
    removeConsole: isProd,
  },
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
};

export default withPWAFeature(nextConfig);
