import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - Next.js 16 requires turbopack config but types might be outdated
  turbopack: {},
};

export default withPWA(nextConfig);
