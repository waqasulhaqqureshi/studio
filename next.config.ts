import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
    "0.0.0.0",
    "0.0.0.0:3000",
    "172.23.16.1",
    "172.23.16.1:3000",
    "*.e2b.app",
  ],
};

export default nextConfig;
