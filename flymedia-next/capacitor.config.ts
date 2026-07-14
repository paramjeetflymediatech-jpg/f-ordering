import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.antera.app',
  appName: 'Antera',
  webDir: 'public',
  server: {
    url: 'https://antera.fly-pos.com/menu',
    cleartext: true
  }
};

export default config;
