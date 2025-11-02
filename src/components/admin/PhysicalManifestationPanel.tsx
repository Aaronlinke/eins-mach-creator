import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Activity } from "lucide-react";

interface IoTNode {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline";
  metrics: { cpu: number; memory: number; temp: number };
}

export default function PhysicalManifestationPanel() {
  const [nodes] = useState<IoTNode[]>([
    { 
      id: "1", 
      name: "Edge Node Frankfurt", 
      location: "DE-FRA-01", 
      status: "online",
      metrics: { cpu: 45, memory: 67, temp: 42 }
    },
    { 
      id: "2", 
      name: "Edge Node Amsterdam", 
      location: "NL-AMS-02", 
      status: "online",
      metrics: { cpu: 38, memory: 54, temp: 39 }
    },
    { 
      id: "3", 
      name: "Edge Node London", 
      location: "UK-LON-01", 
      status: "offline",
      metrics: { cpu: 0, memory: 0, temp: 0 }
    },
    { 
      id: "4", 
      name: "Edge Node Paris", 
      location: "FR-PAR-03", 
      status: "online",
      metrics: { cpu: 52, memory: 71, temp: 44 }
    },
  ]);

  const [dataRate, setDataRate] = useState(1.2);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataRate(prev => +(prev + (Math.random() - 0.5) * 0.1).toFixed(2));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const onlineNodes = nodes.filter(n => n.status === "online").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌐 Physical Manifestation - IoT & Edge Computing
        </CardTitle>
        <CardDescription>
          Verteiltes Infrastruktur-Netzwerk mit 247 Nodes
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
          <h3 className="font-semibold mt-6">Edge Computing Nodes</h3>
          {nodes.map((node) => (
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
                            style={{ width: `${node.metrics.cpu}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs">{node.metrics.cpu}%</span>
                      </div>
                    </div>
                    <div className="bg-background/50 p-2 rounded">
                      <p className="text-muted-foreground mb-1">RAM</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-full rounded-full transition-all"
                            style={{ width: `${node.metrics.memory}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs">{node.metrics.memory}%</span>
                      </div>
                    </div>
                    <div className="bg-background/50 p-2 rounded">
                      <p className="text-muted-foreground mb-1">Temp</p>
                      <p className="font-bold">{node.metrics.temp}°C</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
