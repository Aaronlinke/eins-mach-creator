import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9b0e25a6d52247d5a9dca7b6d83f0dca',
  appName: 'OMEGA AI',
  webDir: 'dist',
  server: {
    url: 'https://9b0e25a6-d522-47d5-a9dc-a7b6d83f0dca.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#8B5CF6'
    },
    BackgroundRunner: {
      label: 'com.omega.ai.background',
      src: 'runner.js',
      event: 'autonomousTask',
      repeat: true,
      interval: 15,
      autoStart: true
    }
  }
};

export default config;
