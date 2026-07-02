import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sequelize'],
  allowedDevOrigins: ['fly-pos.com', '*.fly-pos.com', 'localhost', '*.localhost'],
  devIndicators: false,
};

export default nextConfig;
