declare module "next-pwa" {
  import type { NextConfig } from "next";
  type NextPWAConfig = {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: unknown;
    buildExcludes?: (RegExp | string)[];
  };
  export default function withPWA(config?: NextPWAConfig): (nextConfig: NextConfig) => NextConfig;
}

declare module "next-pwa/cache" {
  const runtimeCaching: unknown;
  export default runtimeCaching;
}
