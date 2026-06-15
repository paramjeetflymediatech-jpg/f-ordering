module.exports = {
  apps: [
    {
      name: 'antigravity-pos-platform',
      script: 'node_modules/.bin/ts-node',
      args: 'src/server.ts',
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
        NODE_ENV: 'production',
        PORT: 3000,
        DB_HOST: '127.0.0.1',
        DB_USER: 'root',
        DB_PASSWORD: 'your_production_password',
        DB_NAME: 'flymedia_db',
        REDIS_URL: 'redis://127.0.0.1:6379',
        NEXTAUTH_SECRET: 'your_production_nextauth_secret_key',
      },
    },
  ],
};
