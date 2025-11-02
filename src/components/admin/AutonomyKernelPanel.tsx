import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Play, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentTask {
  id: string;
  task: string;
  status: "pending" | "running" | "completed";
  result?: string;
  timestamp: string;
}

export default function AutonomyKernelPanel() {
  const { toast } = useToast();
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<AgentTask[]>([]);

  const executeTask = async () => {
    if (!task.trim()) return;

    const newTask: AgentTask = {
      id: Date.now().toString(),
      task: task,
      status: "running",
      timestamp: new Date().toISOString(),
    };

    setTasks([newTask, ...tasks]);
    setTask("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('autonomy-agent', {
        body: { 
          task: newTask.task,
          context: { agentId: newTask.id }
        }
      });

      if (error) throw error;

      setTasks(prev => 
        prev.map(t => 
          t.id === newTask.id 
            ? { ...t, status: "completed", result: data.result }
            : t
        )
      );

      toast({
        title: "Task abgeschlossen",
        description: "Agent hat Task erfolgreich ausgeführt",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Fehler",
        description: error.message || "Task-Ausführung fehlgeschlagen",
        variant: "destructive",
      });
      
      setTasks(prev => prev.filter(t => t.id !== newTask.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Autonomy Kernel - Agent Swarm
        </CardTitle>
        <CardDescription>
          Self-organizing agents with distributed decision-making
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Beschreiben Sie einen Task für die autonomen Agenten..."
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                executeTask();
              }
            }}
          />
          <Button onClick={executeTask} disabled={loading || !task.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTask("Überwache Systemgesundheit und melde Anomalien")}
          >
            System Health Check
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTask("Optimiere Datenbankperformance")}
          >
            DB Optimization
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Agenten-Tasks</h3>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Noch keine Tasks. Weisen Sie den autonomen Agenten einen Task zu.
            </p>
          ) : (
            tasks.map((t) => (
              <Card key={t.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium">{t.task}</p>
                    <Badge variant={
                      t.status === "completed" ? "default" : 
                      t.status === "running" ? "secondary" : "outline"
                    }>
                      {t.status === "running" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {t.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(t.timestamp).toLocaleString()}
                  </p>
                  {t.result && (
                    <div className="bg-muted p-3 rounded text-sm mt-2">
                      <p className="font-semibold mb-1">Ergebnis:</p>
                      <p className="whitespace-pre-wrap">{t.result}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
