import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Activity, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface IoTNode {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline";
  cpu_usage: number;
  memory_usage: number;
  temperature: number;
}

export default function PhysicalManifestationPanel() {
  const { toast } = useToast();
  const [nodes, setNodes] = useState<IoTNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataRate, setDataRate] = useState(1.2);

  useEffect(() => {
    loadNodes();
    
    const interval = setInterval(() => {
      setDataRate(prev => +(prev + (Math.random() - 0.5) * 0.1).toFixed(2));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('iot_nodes')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setNodes((data || []).map(n => ({
        ...n,
        status: n.status as "online" | "offline"
      })));
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "IoT Nodes konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onlineNodes = nodes.filter(n => n.status === "online").length;
  const totalNodes = 247;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌐 Physical Manifestation - IoT & Edge Computing
        </CardTitle>
        <CardDescription>
          Verteiltes Infrastruktur-Netzwerk mit {totalNodes} Nodes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="pt-4 text-center">
              <Wifi className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
              <div className="text-3xl font-bold text-emerald-500">{onlineNodes}</div>
              <p className="text-sm text-muted-foreground">Online Nodes</p>
            </CardContent>
          </Card>

          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="pt-4 text-center">
              <WifiOff className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <div className="text-3xl font-bold text-red-500">{nodes.length - onlineNodes}</div>
              <p className="text-sm text-muted-foreground">Offline Nodes</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="pt-4 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-blue-500">{dataRate} PB/Tag</div>
              <p className="text-sm text-muted-foreground">Datendurchsatz</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between mt-6">
            <h3 className="font-semibold">Edge Computing Nodes</h3>
            <Button variant="outline" size="sm" onClick={loadNodes} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aktualisieren"}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : nodes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Keine Nodes gefunden</p>
          ) : (
            nodes.map((node) => (
            <Card key={node.id} className={
              node.status === "online" 
                ? "border-emerald-500/50 bg-emerald-500/5" 
                : "border-red-500/50 bg-red-500/5"
            }>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{node.name}</h4>
                    <p className="text-sm text-muted-foreground">{node.location}</p>
                  </div>
                  <Badge variant={node.status === "online" ? "default" : "destructive"}>
                    {node.status === "online" ? (
                      <><Wifi className="h-3 w-3 mr-1" /> Online</>
                    ) : (
                      <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                    )}
                  </Badge>
                </div>

                {node.status === "online" && (
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-background/50 p-2 rounded">
                      <p className="text-muted-foreground mb-1">CPU</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${node.cpu_usage}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs">{node.cpu_usage}%</span>
                      </div>
                    </div>
                    <div className="bg-background/50 p-2 rounded">
                      <p className="text-muted-foreground mb-1">RAM</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-full rounded-full transition-all"
                            style={{ width: `${node.memory_usage}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs">{node.memory_usage}%</span>
                      </div>
                    </div>
                    <div className="bg-background/50 p-2 rounded">
                      <p className="text-muted-foreground mb-1">Temp</p>
                      <p className="font-bold">{node.temperature}°C</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2">Netzwerk-Statistik</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Gesamt-Nodes</p>
              <p className="font-semibold text-lg">{totalNodes}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Verfügbarkeit</p>
              <p className="font-semibold text-lg">{((onlineNodes / nodes.length) * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Durchschn. Latenz</p>
              <p className="font-semibold text-lg">12ms</p>
            </div>
            <div>
              <p className="text-muted-foreground">Daten/Tag</p>
              <p className="font-semibold text-lg">1.2 PB</p>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mt-6">
          <p className="text-sm font-semibold mb-2">Netzwerk-Status:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Gesamt Nodes: <span className="font-bold text-primary">247</span></div>
            <div>Verfügbarkeit: <span className="font-bold text-emerald-500">99.2%</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
