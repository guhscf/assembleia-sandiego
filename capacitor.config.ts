import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.residencialsandiego.app',
  appName: 'SanDiego+',
  webDir: 'build',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      releaseType: 'APK',
    },
  },
};

export default config;
