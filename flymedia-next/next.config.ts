import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sequelize'],
  allowedDevOrigins: ['fly-pos.com'],
  
};

export default nextConfig;
