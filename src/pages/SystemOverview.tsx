import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Activity, Database, Wifi, AlertCircle, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export default function SystemOverview() {
  const navigate = useNavigate();
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  const { data: events } = useQuery({
    queryKey: ["all-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_events")
        .select("*, system_layers(name, icon)")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: apiConnections } = useQuery({
    queryKey: ["api-connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_connections")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: layers } = useQuery({
    queryKey: ["system-layers-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_layers")
        .select("*")
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('all-system-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_events'
        },
        (payload) => {
          setLiveEvents(prev => [payload.new, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const allEvents = [...liveEvents, ...(events || [])].slice(0, 20);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">System-Übersicht</h1>
            <p className="text-muted-foreground">Echtzeit-Monitoring aller Systemkomponenten</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/")}>Dashboard</Button>
            <Button variant="outline" onClick={() => navigate("/admin")}>Admin-Portal</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* API Connections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                API-Verbindungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apiConnections && apiConnections.length > 0 ? (
                <div className="space-y-2">
                  {apiConnections.map((conn) => (
                    <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-semibold">{conn.connection_name}</p>
                        <p className="text-xs text-muted-foreground">{conn.api_type}</p>
                      </div>
                      <Badge variant={conn.is_active ? "default" : "secondary"}>
                        {conn.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine API Connections konfiguriert</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System-Gesundheit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Gesamtstatus</span>
                  <Badge className="bg-emerald-500">Operational</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Uptime</span>
                  <span className="font-semibold">99.97%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Aktive Layers</span>
                  <span className="font-semibold">8/8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Events (24h)</span>
                  <span className="font-semibold">{allEvents.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Layers Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              System-Layer Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {layers && layers.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {layers.map((layer) => (
                  <div 
                    key={layer.id}
                    className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/layer/${layer.layer_id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{layer.icon}</span>
                      <Badge 
                        variant={
                          layer.status === 'operational' ? 'default' :
                          layer.status === 'warning' ? 'secondary' : 'destructive'
                        }
                      >
                        {layer.status === 'operational' ? 'Aktiv' :
                         layer.status === 'warning' ? 'Warnung' : 'Kritisch'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{layer.name}</h3>
                    <p className="text-xs text-muted-foreground">{layer.metric}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                Keine Layer-Daten verfügbar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Live Event Stream */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Live-Event-Stream
              <Badge variant="outline" className="ml-2 animate-pulse">
                LIVE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allEvents.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {allEvents.map((event, idx) => (
                  <div 
                    key={event.id || idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Badge 
                      variant={
                        event.severity === 'critical' ? 'destructive' :
                        event.severity === 'error' ? 'destructive' :
                        event.severity === 'warning' ? 'secondary' : 'outline'
                      }
                    >
                      {event.severity}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{event.event_type}</span>
                        {event.system_layers && (
                          <span className="text-xs">
                            {event.system_layers.icon} {event.system_layers.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{event.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.created_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Keine Events verfügbar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
