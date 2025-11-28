const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: require("next-pwa/cache"),
  buildExcludes: [/middleware-manifest\.json$/],
});

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  compiler: {
    removeConsole: isProd,
  },
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);

