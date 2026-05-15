/*Here we can configure nextjs features, we can use different build and image settings*/

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack — use stable Webpack instead
  turbopack: false,
};

export default nextConfig;
