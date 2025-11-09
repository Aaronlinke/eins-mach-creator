import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker registriert'))
        .catch(err => console.error('SW Fehler:', err));
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      toast({
        title: "App installierbar!",
        description: "Du kannst diese App auf deinem Gerät installieren",
        duration: 5000,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      toast({
        title: "App installiert!",
        description: "EINS MACH ist jetzt auf deinem Gerät",
      });
    }
    
    setDeferredPrompt(null);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Nicht unterstützt",
        description: "Dein Browser unterstützt keine Push-Benachrichtigungen",
        variant: "destructive",
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast({
        title: "Benachrichtigungen aktiviert!",
        description: "Du erhältst jetzt Updates vom AI System",
      });
      return true;
    }
    
    return false;
  };

  return {
    isInstalled,
    canInstall: !!deferredPrompt,
    installApp,
    requestNotificationPermission,
  };
};
