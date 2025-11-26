declare module "next-pwa" {
  import type { NextConfig } from "next";
  type NextPWAConfig = {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: any;
    buildExcludes?: (RegExp | string)[];
  };
  export default function withPWA(config?: NextPWAConfig): (nextConfig: NextConfig) => NextConfig;
}

declare module "next-pwa/cache" {
  const runtimeCaching: any;
  export default runtimeCaching;
}
