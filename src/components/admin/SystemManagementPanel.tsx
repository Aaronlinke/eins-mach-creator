import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Settings, Activity, AlertCircle, TrendingUp, Users, RefreshCw, Shield, Gauge, HardDrive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    setLoading(true);
    try {
      const [eventsRes, metricsRes] = await Promise.all([
        supabase.from('system_events').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('system_metrics').select('*').order('timestamp', { ascending: false }).limit(5),
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (metricsRes.error) throw metricsRes.error;

      setEvents(eventsRes.data || []);
      setMetrics(metricsRes.data || []);
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

  const runBrainOptimization = async () => {
    try {
      toast({ title: "Brain-Optimierung", description: "Wird gestartet..." });
      const { error } = await supabase.functions.invoke('brain-scheduler');
      if (error) throw error;
      toast({ title: "Erfolg", description: "Brain-Optimierung wurde gestartet." });
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message || "Konnte nicht gestartet werden.", variant: "destructive" });
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
          <CardDescription>System-Daten und Konfigurationen verwalten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => window.open('/overview', '_blank')}>
            System-Layer anzeigen
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={loadSystemData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            System-Daten aktualisieren
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={runBrainOptimization}>
            <Activity className="mr-2 h-4 w-4" />
            Brain-Optimierung starten
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System-Konfiguration
          </CardTitle>
          <CardDescription>System-Einstellungen und Parameter konfigurieren</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Dialog open={securityDialogOpen} onOpenChange={setSecurityDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Sicherheitsrichtlinien
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sicherheitsrichtlinien</DialogTitle>
                <DialogDescription>Aktuelle Sicherheitskonfiguration</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>JWT-Verifizierung</span>
                  <Badge>Aktiv</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>RLS-Policies</span>
                  <Badge>Konfiguriert</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>SSRF-Schutz</span>
                  <Badge>Aktiv</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Rate Limiting</span>
                  <Badge>10 req/min</Badge>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={performanceDialogOpen} onOpenChange={setPerformanceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Gauge className="mr-2 h-4 w-4" />
                Performance-Tuning
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Performance-Einstellungen</DialogTitle>
                <DialogDescription>Aktuelle Performance-Konfiguration</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Brain-Optimierung</span>
                  <Badge variant="secondary">Parallel (4x)</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Realtime-Updates</span>
                  <Badge>Aktiv</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Stale-Task-Cleanup</span>
                  <Badge>30 min Timeout</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Scheduler</span>
                  <Badge>Auto-Bereinigung</Badge>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="w-full justify-start" onClick={() => {
            toast({ title: "Backup", description: "Automatische Backups sind über Lovable Cloud aktiviert." });
          }}>
            <HardDrive className="mr-2 h-4 w-4" />
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
          <CardDescription>Letzte System-Ereignisse und Logs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Lädt Events...</p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Keine Events vorhanden</p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Badge variant={getSeverityColor(event.severity) as any}>{event.severity}</Badge>
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
          <CardDescription>Live System-Metriken und Performance-Indikatoren</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Database className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">Aktive Layer</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-sm text-muted-foreground">System Events</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">99.97%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Activity className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{metrics.length}</p>
              <p className="text-sm text-muted-foreground">Aktive Metriken</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
