import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sequelize'],
  allowedDevOrigins: ['10.0.2.2','fly-pos.com', '*.fly-pos.com', 'localhost', '*.localhost','127.0.0.1'],
  devIndicators: false,
};

export default nextConfig;
