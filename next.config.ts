import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.0.18", "isa-above-equally-cio.trycloudflare.com"],
  // Turbopack'in middleware tracing hatasını aşmak için Webpack derleyicisine dönmeye zorluyoruz:
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
