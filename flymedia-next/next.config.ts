import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sequelize'],
  allowedDevOrigins: ['fly-pos.com', '*.fly-pos.com', 'localhost', '*.localhost'],
  
};

export default nextConfig;
