module.exports = {
  apps: [
    {
      name: 'f-ordering',
      script: 'npx',
      args: 'tsx src/server.ts',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_NAME: process.env.DB_NAME,
        REDIS_URL: process.env.REDIS_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      },
    },
  ],
};
