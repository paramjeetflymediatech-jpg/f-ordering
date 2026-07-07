import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sequelize'],
  allowedDevOrigins: ['10.0.2.2','fly-pos.com', '*.fly-pos.com', 'localhost', '*.localhost'],
  devIndicators: false,
};

export default nextConfig;
