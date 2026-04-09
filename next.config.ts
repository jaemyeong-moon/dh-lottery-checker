import type { NextConfig } from "next";
import path from "path";

const isProd = process.env.NODE_ENV === "production";
// GitHub Pages 배포 시 레포 이름을 BASE_PATH env로 설정 (예: /my-lotto)
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true }, // static export는 Image Optimization API 불가
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
