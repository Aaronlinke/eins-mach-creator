import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { Smartphone, Download, Bell, Check } from 'lucide-react';

export const MobileConnectionPanel = () => {
  const { isInstalled, canInstall, installApp, requestNotificationPermission } = usePWA();

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Mobile Verbindung</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">App Installation</h3>
            <p className="text-sm text-muted-foreground">
              Installiere EINS MACH auf deinem Gerät
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

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Push-Benachrichtigungen</h3>
            <p className="text-sm text-muted-foreground">
              Erhalte Updates vom AI System
            </p>
          </div>
          <Button onClick={requestNotificationPermission} size="sm" variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Aktivieren
          </Button>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <h3 className="font-semibold text-sm">Installationsanleitung:</h3>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>📱 <strong>iOS:</strong> Safari → Teilen → "Zum Home-Bildschirm"</li>
            <li>🤖 <strong>Android:</strong> Chrome → Menü → "App installieren"</li>
            <li>💻 <strong>Desktop:</strong> Installieren-Symbol in der Adressleiste</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-primary">✓</div>
            <div className="text-xs text-muted-foreground mt-1">Offline-Fähig</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-primary">⚡</div>
            <div className="text-xs text-muted-foreground mt-1">Schnellstart</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-primary">🔔</div>
            <div className="text-xs text-muted-foreground mt-1">Push-Updates</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-primary">📲</div>
            <div className="text-xs text-muted-foreground mt-1">Native Feel</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
