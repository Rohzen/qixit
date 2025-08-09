
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.quixit',
  appName: 'quixit',
  webDir: '.',
  bundledWebRuntime: false,
  server: { androidScheme: 'https' }
};

export default config;
