import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Zap, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface LayerDetails {
  technology: string;
  capabilities: string[];
  metrics: Record<string, any>;
}

export default function LayerDetail() {
  const { layerId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);

  const { data: layer, isLoading } = useQuery({
    queryKey: ["layer", layerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_layers")
        .select("*")
        .eq("layer_id", layerId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: recentEvents } = useQuery({
    queryKey: ["layer-events", layerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_events")
        .select("*")
        .eq("layer_id", layerId)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!layerId) return;

    const channel = supabase
      .channel(`layer-events-${layerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_events',
          filter: `layer_id=eq.${layerId}`
        },
        (payload) => {
          setEvents(prev => [payload.new, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [layerId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin text-4xl">⚙️</div>
      </div>
    );
  }

  if (!layer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg mb-4">Layer nicht gefunden</p>
          <Button onClick={() => navigate("/")}>Zurück zum Dashboard</Button>
        </Card>
      </div>
    );
  }

  const details: LayerDetails = (layer?.details as unknown as LayerDetails) || { technology: "", capabilities: [], metrics: {} };
  const statusColors: Record<string, string> = {
    operational: "text-emerald-400",
    warning: "text-amber-400",
    critical: "text-red-400",
  };

  const allEvents = [...events, ...(recentEvents || [])].slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Dashboard
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-6xl">{layer.icon}</span>
                  <div>
                    <CardTitle className="text-4xl mb-2">{layer.name}</CardTitle>
                    <p className="text-muted-foreground">{layer.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant="outline" 
                    className={`${statusColors[layer?.status || 'operational']} border-current mb-2`}
                  >
                    {layer?.status.toUpperCase()}
                  </Badge>
                  <p className="text-2xl font-bold text-primary">{layer?.metric}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Technology & Metrics Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Technologie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold mb-4">{details.technology}</p>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-semibold">Capabilities:</p>
                  {details.capabilities?.map((cap, idx) => (
                    <Badge key={idx} variant="secondary" className="mr-2">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(details.metrics || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-semibold">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allEvents.length > 0 ? (
                <div className="space-y-2">
                  {allEvents.map((event, idx) => (
                    <div 
                      key={event.id || idx} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Badge variant={event.severity === 'error' ? 'destructive' : 'secondary'}>
                        {event.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm">{event.message}</p>
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
    </div>
  );
}
