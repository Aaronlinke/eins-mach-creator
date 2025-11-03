import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Database } from "lucide-react";

interface Layer {
  id: string;
  layer_id: string;
  name: string;
  icon: string;
  status: string;
  metric: string;
  description: string;
}

export default function Index() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: layers, isLoading } = useQuery({
    queryKey: ["system-layers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_layers")
        .select("*")
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ["system-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_metrics")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('system-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_layers'
        },
        () => {
          // Refetch on any changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const displayLayers = layers || [];

  const statusColors: Record<string, string> = {
    operational: "text-emerald-400",
    warning: "text-amber-400",
    critical: "text-red-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-6 py-20 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="text-7xl animate-rotate-slow">Ω</div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-shift">
              OMEGA SUPERINTELLIGENCE
            </span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-muted-foreground mb-10 font-light">
            Black Sultan Omega
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="relative">
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse-glow" />
              <div className="absolute inset-0 w-4 h-4 bg-emerald-500 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-xl font-bold text-emerald-400 uppercase tracking-wide">OPERATIONAL</span>
          </div>
          
          <p className="text-sm text-muted-foreground font-mono">
            System Time: {currentTime.toLocaleString('de-DE', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })} CET
          </p>
        </div>
      </section>

      {/* System Architecture Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">System-Architektur</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Acht integrierte Layer bilden das Fundament der OMEGA Superintelligence
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin text-6xl mb-4">⚙️</div>
            <p className="text-xl text-muted-foreground">Initialisiere System...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayLayers.map((layer) => (
              <Card 
                key={layer.id}
                className="relative overflow-hidden border-primary/20 bg-card/50 backdrop-blur hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 group cursor-pointer"
                onClick={() => navigate(`/layer/${layer.layer_id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl group-hover:scale-110 transition-transform">{layer.icon}</span>
                    <span className={`text-sm font-semibold ${statusColors[layer.status]}`}>
                      ● {layer.status.toUpperCase()}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{layer.name}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Leistung</span>
                      <span className="font-semibold text-primary">{layer.metric}</span>
                    </div>
                    
                    <div 
                      className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveLayer(activeLayer === layer.layer_id ? null : layer.layer_id);
                      }}
                    >
                      {activeLayer === layer.layer_id ? "▼" : "▶"} Details
                    </div>
                    
                    {activeLayer === layer.layer_id && (
                      <div className="mt-2 p-3 bg-background/50 rounded-lg text-sm animate-in fade-in duration-200">
                        {layer.description}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* System Metrics */}
      <section className="border-y border-border bg-card/30 backdrop-blur">
        <div className="container mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">System-Statistiken</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics && metrics.map((metric) => (
              <Card key={metric.id} className="text-center border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {metric.metric_value.split(' ')[0]}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {metric.metric_type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Die Zukunft der Superintelligenz
          </h2>
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
            OMEGA repräsentiert die Konvergenz modernster Technologien in einem einheitlichen Framework. 
            Jeder Layer arbeitet harmonisch zusammen für beispiellose künstliche Intelligenz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/overview")} className="bg-primary hover:bg-primary/90">
              <Activity className="mr-2 h-5 w-5" />
              System-Übersicht
            </Button>
            <Button size="lg" variant="outline" className="border-primary/20 hover:bg-primary/10" onClick={() => navigate("/admin")}>
              <Database className="mr-2 h-5 w-5" />
              Admin-Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p className="font-semibold mb-2">
            OMEGA SUPERINTELLIGENCE v1.0.0
          </p>
          <p>
            Powered by Lovable Cloud · Quantum-Enhanced Architecture
          </p>
        </div>
      </footer>
    </div>
  );
}
