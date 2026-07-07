import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.harrybistro',
  appName: 'Harry Bistro',
  webDir: 'public',
  server: {
    url: 'https://harry-bistro.fly-pos.com/menu',
    cleartext: true
  }
};

export default config;
