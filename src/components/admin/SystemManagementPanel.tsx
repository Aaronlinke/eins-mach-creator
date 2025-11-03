import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Settings, Activity, AlertCircle, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SystemEvent {
  id: string;
  event_type: string;
  severity: string;
  message: string;
  created_at: string;
  layer_id?: string;
}

interface SystemMetric {
  id: string;
  metric_type: string;
  metric_value: string;
  timestamp: string;
}

export default function SystemManagementPanel() {
  const { toast } = useToast();
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    setLoading(true);
    try {
      // Lade letzte 10 System-Events
      const { data: eventsData, error: eventsError } = await supabase
        .from('system_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Lade letzte Metriken
      const { data: metricsData, error: metricsError } = await supabase
        .from('system_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

      if (metricsError) throw metricsError;
      setMetrics(metricsData || []);
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "System-Daten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Datenbank-Management
          </CardTitle>
          <CardDescription>
            System-Daten und Konfigurationen verwalten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => window.open('/overview', '_blank')}
          >
            System-Layer anzeigen
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={loadSystemData}
          >
            System-Daten aktualisieren
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => {
              toast({
                title: "Metriken-Dashboard",
                description: "Detailliertes Dashboard wird geöffnet...",
              });
            }}
          >
            Metriken-Dashboard
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System-Konfiguration
          </CardTitle>
          <CardDescription>
            System-Einstellungen und Parameter konfigurieren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            Auth-Einstellungen
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Sicherheitsrichtlinien
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Performance-Tuning
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Backup & Wiederherstellung
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            System-Events (Live)
          </CardTitle>
          <CardDescription>
            Letzte System-Ereignisse und Logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Lädt Events...</p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Keine Events vorhanden
            </p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Badge variant={getSeverityColor(event.severity) as any}>
                      {event.severity}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.event_type}</p>
                      <p className="text-sm text-muted-foreground">{event.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.created_at).toLocaleString('de-DE')}
                        {event.layer_id && ` • Layer: ${event.layer_id}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Echtzeit-Monitoring
          </CardTitle>
          <CardDescription>
            Live System-Metriken und Performance-Indikatoren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">Aktive Layer</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-sm text-muted-foreground">System Events</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">99.97%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{metrics.length}</p>
              <p className="text-sm text-muted-foreground">Aktive Metriken</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}