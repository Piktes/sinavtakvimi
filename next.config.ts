import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sol alttaki yuvarlak "N" rozeti Next.js'in geliştirici göstergesidir
  // (yalnızca `pnpm dev`'de görünür, üretimde zaten çıkmaz). Tasarımı
  // bozduğu için kapatıldı.
  devIndicators: false,
};

export default nextConfig;
