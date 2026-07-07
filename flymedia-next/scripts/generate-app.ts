import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Usage: npm run generate-app <slug> "<app-name>" <app-id> [android|ios|all]
const slug = process.argv[2];
const appName = process.argv[3];
const appId = process.argv[4];
const targetPlatform = process.argv[5] || 'all';

if (!slug || !appName || !appId) {
  console.log('\n❌ Error: Missing arguments.');
  console.log('Usage: npm run generate-app <slug> "<app-name>" <app-id> [android|ios|all]');
  console.log('Example: npm run generate-app mitran "Mitran Cafe" com.mitran.app android\n');
  process.exit(1);
}

const cleanFolder = (folderPath: string) => {
  if (fs.existsSync(folderPath)) {
    console.log(`🧹 Removing existing folder: ${folderPath}...`);
    fs.rmSync(folderPath, { recursive: true, force: true });
  }
};

try {
  console.log(`\n🚀 Starting Mobile App Generator for: "${appName}" (${slug})`);
  console.log(`=======================================================`);

  // 1. Resolve base domain from .env file
  let baseDomain = 'fly-pos.com';
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const domainMatch = envContent.match(/NEXT_PUBLIC_URL\s*=\s*(.+)/i);
    if (domainMatch) {
      baseDomain = domainMatch[1].trim().replace(/^https?:\/\//i, '').split('/')[0];
    }
  }
  const targetUrl = `https://${slug}.${baseDomain}/menu`;
  console.log(`ℹ️ Target Live App URL: ${targetUrl}`);

  // 2. Clean existing platform folders based on target
  if (targetPlatform === 'android' || targetPlatform === 'all') {
    cleanFolder(path.join(process.cwd(), 'android'));
  }
  if (targetPlatform === 'ios' || targetPlatform === 'all') {
    cleanFolder(path.join(process.cwd(), 'ios'));
  }

  // 3. Write dynamic capacitor.config.ts
  const configContent = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${appId}',
  appName: '${appName}',
  webDir: 'public',
  server: {
    url: '${targetUrl}',
    cleartext: true
  }
};

export default config;
`;

  fs.writeFileSync(path.join(process.cwd(), 'capacitor.config.ts'), configContent, 'utf-8');
  console.log(`✅ capacitor.config.ts written successfully!`);

  // 4. Run Capacitor Platform Add commands
  if (targetPlatform === 'android' || targetPlatform === 'all') {
    console.log(`🤖 Adding Android Native Platform Shell...`);
    execSync('npx cap add android', { stdio: 'inherit' });
  }

  if (targetPlatform === 'ios' || targetPlatform === 'all') {
    console.log(`🍏 Adding iOS Native Platform Shell...`);
    execSync('npx cap add ios', { stdio: 'inherit' });
  }

  console.log(`\n🎉 Success! Mobile project wrapper compiled successfully.`);
  console.log(`-------------------------------------------------------`);
  console.log(`To open the native projects in IDEs:`);
  if (targetPlatform === 'android' || targetPlatform === 'all') {
    console.log(`- Open Android Studio: npx cap open android`);
  }
  if (targetPlatform === 'ios' || targetPlatform === 'all') {
    console.log(`- Open Xcode (macOS only): npx cap open ios`);
  }
  console.log(`\nTo update native files after web modifications: npx cap sync\n`);

} catch (error: any) {
  console.error(`\n❌ Compilation Error:`, error.message);
  process.exit(1);
}
