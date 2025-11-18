import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useCapacitor } from '@/hooks/useCapacitor';
import { Smartphone, Download, Bell, Check, Zap, PlayCircle } from 'lucide-react';

export const MobileConnectionPanel = () => {
  const { isInstalled, canInstall, installApp, requestNotificationPermission } = usePWA();
  const { 
    isNative, 
    pushToken, 
    initPushNotifications, 
    scheduleNotification, 
    startBackgroundTasks 
  } = useCapacitor();

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Mobile Verbindung</h2>
      </div>

      <div className="space-y-4">
        {/* App Type Indicator */}
        <div className="p-4 border rounded-lg bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">App-Typ</h3>
              <p className="text-sm text-muted-foreground">
                {isNative ? 'Native Capacitor App' : 'Progressive Web App (PWA)'}
              </p>
            </div>
            {isNative && (
              <div className="flex items-center gap-2 text-green-500">
                <Zap className="h-5 w-5" />
                <span className="text-sm font-medium">Native</span>
              </div>
            )}
          </div>
        </div>

        {/* PWA Installation */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">PWA Installation</h3>
            <p className="text-sm text-muted-foreground">
              Installiere als Web-App
            </p>
          </div>
          {isInstalled ? (
            <div className="flex items-center gap-2 text-green-500">
              <Check className="h-5 w-5" />
              <span className="text-sm font-medium">Installiert</span>
            </div>
          ) : canInstall ? (
            <Button onClick={installApp} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Installieren
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">
              Öffne im Browser
            </span>
          )}
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">
              {isNative ? 'Native Push-Notifications' : 'Web Push-Notifications'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isNative ? 'Volle System-Integration' : 'Browser-basierte Benachrichtigungen'}
            </p>
            {pushToken && (
              <p className="text-xs text-muted-foreground mt-1">Token: {pushToken.slice(0, 20)}...</p>
            )}
          </div>
          <Button 
            onClick={isNative ? initPushNotifications : requestNotificationPermission} 
            size="sm" 
            variant="outline"
          >
            <Bell className="h-4 w-4 mr-2" />
            Aktivieren
          </Button>
        </div>

        {/* Background Tasks (Native only) */}
        {isNative && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
            <div>
              <h3 className="font-semibold">Hintergrund-Tasks</h3>
              <p className="text-sm text-muted-foreground">
                AI läuft auch bei geschlossener App
              </p>
            </div>
            <Button onClick={startBackgroundTasks} size="sm" variant="default">
              <PlayCircle className="h-4 w-4 mr-2" />
              Aktivieren
            </Button>
          </div>
        )}

        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <h3 className="font-semibold text-sm">
            {isNative ? 'Native App Setup:' : 'PWA Installationsanleitung:'}
          </h3>
          {isNative ? (
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>✅ <strong>Hintergrund-Tasks:</strong> Läuft dauerhaft im Hintergrund</li>
              <li>✅ <strong>System-Integration:</strong> Voller Zugriff auf Gerätfunktionen</li>
              <li>✅ <strong>App Store:</strong> Kann in App Stores veröffentlicht werden</li>
              <li>⚡ <strong>Performance:</strong> Native Performance und Stabilität</li>
            </ul>
          ) : (
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>📱 <strong>iOS:</strong> Safari → Teilen → "Zum Home-Bildschirm"</li>
              <li>🤖 <strong>Android:</strong> Chrome → Menü → "App installieren"</li>
              <li>💻 <strong>Desktop:</strong> Installieren-Symbol in der Adressleiste</li>
              <li>🚀 <strong>Upgrade:</strong> Für volle Features: Native App installieren</li>
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-primary">✓</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isNative ? 'Immer Aktiv' : 'Offline-Fähig'}
            </div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-primary">⚡</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isNative ? 'Native Speed' : 'Schnellstart'}
            </div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-primary">🔔</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isNative ? 'System Push' : 'Web Push'}
            </div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-primary">📲</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isNative ? 'True Native' : 'Native Feel'}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
