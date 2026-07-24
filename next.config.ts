import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* /SOC-prep → /soc-prep canonicalization lives in src/proxy.ts (redirects
     here match case-insensitively and would loop). */
};

export default nextConfig;
