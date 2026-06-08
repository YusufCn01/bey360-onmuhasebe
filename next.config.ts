import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.0.18", "isa-above-equally-cio.trycloudflare.com"],
  // Turbopack'in manuel oluşturduğumuz .nft.json dosyasını silmemesi için:
  cleanDistDir: false,
};

export default nextConfig;
