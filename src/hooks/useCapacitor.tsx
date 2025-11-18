import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BackgroundRunner } from '@capacitor/background-runner';
import { useToast } from '@/hooks/use-toast';

export const useCapacitor = () => {
  const [isNative, setIsNative] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if running as native app
    const checkNative = async () => {
      try {
        const info = await App.getInfo();
        setIsNative(!!info.id);
      } catch {
        setIsNative(false);
      }
    };

    checkNative();
  }, []);

  // Initialize Push Notifications
  const initPushNotifications = async () => {
    if (!isNative) {
      toast({
        title: "Nur für Native App",
        description: "Push-Notifications funktionieren nur in der installierten App",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        await PushNotifications.register();
        
        // Get FCM token
        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token: ' + token.value);
          setPushToken(token.value);
          toast({
            title: "Push-Notifications aktiviert!",
            description: "Du erhältst jetzt Updates vom AI System",
          });
        });

        // Handle push received
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received: ' + JSON.stringify(notification));
          toast({
            title: notification.title || 'OMEGA AI',
            description: notification.body,
          });
        });

        // Handle push action
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push action performed: ' + JSON.stringify(notification));
        });

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      toast({
        title: "Fehler",
        description: "Push-Notifications konnten nicht aktiviert werden",
        variant: "destructive",
      });
      return false;
    }
  };

  // Initialize Local Notifications
  const initLocalNotifications = async () => {
    if (!isNative) return false;

    try {
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display === 'granted') {
        // Listen to local notification events
        LocalNotifications.addListener('localNotificationReceived', (notification) => {
          console.log('Local notification received: ', notification);
        });

        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          console.log('Local notification action: ', notification);
        });

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing local notifications:', error);
      return false;
    }
  };

  // Schedule Local Notification
  const scheduleNotification = async (title: string, body: string, delay: number = 0) => {
    if (!isNative) {
      toast({
        title: title,
        description: body,
      });
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + delay * 1000) },
          sound: 'default',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#8B5CF6',
        }]
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  // Start Background Runner
  const startBackgroundTasks = async () => {
    if (!isNative) {
      toast({
        title: "Nur für Native App",
        description: "Hintergrund-Tasks funktionieren nur in der installierten App",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await BackgroundRunner.requestPermissions({
        apis: ['notifications']
      });
      
      toast({
        title: "Hintergrund-Tasks aktiviert!",
        description: "AI arbeitet jetzt auch wenn die App geschlossen ist",
      });
      
      return true;
    } catch (error) {
      console.error('Error starting background tasks:', error);
      toast({
        title: "Fehler",
        description: "Hintergrund-Tasks konnten nicht gestartet werden",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    isNative,
    pushToken,
    initPushNotifications,
    initLocalNotifications,
    scheduleNotification,
    startBackgroundTasks,
  };
};
