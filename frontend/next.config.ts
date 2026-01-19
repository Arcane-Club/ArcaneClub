import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  },
};

export default nextConfig;
