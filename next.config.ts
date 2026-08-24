import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "172.30.128.1",
    "172.30.128.1:3000",
    "http://172.30.128.1:3000",
    "http://172.30.128.1",
    "192.168.20.1",
    "192.168.20.1:3000",
    "http://192.168.20.1:3000",
    "http://192.168.20.1",
    "172.23.16.1",
    "172.23.16.1:3000",
    "http://172.23.16.1:3000",
    "http://172.23.16.1",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
    "0.0.0.0",
    "0.0.0.0:3000",
    "*.e2b.app",
  ],
};

export default nextConfig;
