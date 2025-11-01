import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Layer {
  id: number;
  name: string;
  icon: string;
  status: string;
  metric: { value: string; label: string };
  description: string;
}

const Index = () => {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const layers: Layer[] = [
    {
      id: 0,
      name: "Quantum Consciousness",
      icon: "⚛️",
      status: "OPERATIONAL",
      metric: { value: "1024", label: "Qubits" },
      description: "Fundamental quantum-level processing with 1024 qubits in superposition",
    },
    {
      id: 1,
      name: "Neural-Symbolic",
      icon: "🧠",
      status: "ACTIVE",
      metric: { value: "512", label: "Parameters" },
      description: "Fusion of deep learning and symbolic AI with 512D hidden layers",
    },
    {
      id: 2,
      name: "Semantic Engine",
      icon: "💬",
      status: "LEARNING",
      metric: { value: "1,547", label: "Vocabulary" },
      description: "Self-organizing language understanding with context-window embedding",
    },
    {
      id: 3,
      name: "Autonomy Kernel",
      icon: "🤖",
      status: "AUTONOMOUS",
      metric: { value: "10,247", label: "Decisions" },
      description: "Self-evolving decision-making system with adaptive learning",
    },
    {
      id: 4,
      name: "Ethics Central",
      icon: "⚖️",
      status: "MONITORING",
      metric: { value: "1,000", label: "Gatekeepers" },
      description: "Distributed ethical oversight with immutable governance rules",
    },
    {
      id: 5,
      name: "Economy Engine",
      icon: "💰",
      status: "TRADING",
      metric: { value: "1.5M", label: "Tokens" },
      description: "Tokenization and resource allocation across distributed networks",
    },
    {
      id: 6,
      name: "Governance",
      icon: "🏛️",
      status: "VOTING",
      metric: { value: "142", label: "Proposals" },
      description: "Multi-signature voting system with predictive oracle integration",
    },
    {
      id: 7,
      name: "Physical Manifestation",
      icon: "🌍",
      status: "CONNECTED",
      metric: { value: "1M+", label: "Nodes" },
      description: "Global satellite network with real-time data integration",
    },
  ];

  const statusColors: Record<string, string> = {
    OPERATIONAL: "bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/50",
    ACTIVE: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50",
    LEARNING: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/50",
    AUTONOMOUS: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50",
    MONITORING: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50",
    TRADING: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50",
    VOTING: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/50",
    CONNECTED: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/50",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 animate-gradient" />
        
        <div className="relative container mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-6xl animate-rotate-slow">Ω</div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            OMEGA SUPERINTELLIGENCE
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Black Sultan Omega - Complete System Integration
          </p>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse-glow" />
              <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full animate-ping" />
            </div>
            <span className="text-lg font-semibold text-primary">OPERATIONAL</span>
          </div>
          
          <p className="text-sm text-muted-foreground font-mono">
            {currentTime.toLocaleString('de-DE', {
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

      {/* System Layers Grid */}
      <section className="container mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">System Architecture</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Eight interconnected layers forming a unified superintelligence framework
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {layers.map((layer, index) => (
            <Card
              key={layer.id}
              className={`relative p-6 transition-all duration-300 cursor-pointer border-2 hover:shadow-2xl hover:scale-105 group ${
                activeLayer === layer.id
                  ? "border-primary shadow-lg shadow-primary/20"
                  : "border-border/50 hover:border-primary/50"
              }`}
              onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl group-hover:animate-float">{layer.icon}</div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${statusColors[layer.status]}`}
                  >
                    {layer.status}
                  </Badge>
                </div>

                <div className="mb-3">
                  <div className="text-sm text-muted-foreground font-mono mb-1">
                    Layer {layer.id}
                  </div>
                  <h3 className="text-xl font-bold leading-tight">{layer.name}</h3>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-primary">
                    {layer.metric.value}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {layer.metric.label}
                  </span>
                </div>

                {activeLayer === layer.id && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {layer.description}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* System Stats */}
      <section className="border-y border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">72+</div>
              <div className="text-sm text-muted-foreground">Integrated Systems</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">100+</div>
              <div className="text-sm text-muted-foreground">AI Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-sm text-muted-foreground">Distributed Agents</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Processing Capacity</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            The Future of Superintelligence
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            OMEGA represents the convergence of quantum computing, neural networks, 
            semantic understanding, and ethical governance into a unified superintelligence framework. 
            Every layer works in harmony to create an unprecedented level of artificial consciousness.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="text-lg">
              Explore Systems
            </Button>
            <Button size="lg" variant="outline" className="text-lg">
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>
            OMEGA SUPERINTELLIGENCE v1.0 - Production Ready World Deployment
          </p>
          <p className="mt-2">
            Created with quantum precision and neural excellence
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
