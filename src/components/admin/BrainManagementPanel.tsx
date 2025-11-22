import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Sparkles, Network, FileText, TrendingUp, Loader2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export const BrainManagementPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_knowledge: 0,
    optimizations: 0,
    connections: 0,
    insights: 0
  });
  const [latestInsight, setLatestInsight] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadTasks();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: knowledge } = await supabase
        .from('ai_knowledge')
        .select('*')
        .eq('user_id', user.id);

      const optimizations = knowledge?.filter(k => k.category === 'brain_optimization').length || 0;
      const connections = knowledge?.filter(k => k.category === 'knowledge_graph').length || 0;
      const insights = knowledge?.filter(k => k.category === 'daily_insights').length || 0;

      const latestInsightData = knowledge?.find(k => k.category === 'daily_insights');
      if (latestInsightData?.value && typeof latestInsightData.value === 'object' && 'insights' in latestInsightData.value) {
        setLatestInsight((latestInsightData.value as any).insights || '');
      }

      setStats({
        total_knowledge: knowledge?.length || 0,
        optimizations,
        connections,
        insights
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('autonomous_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_type', 'brain_optimization')
        .order('created_at', { ascending: false })
        .limit(5);

      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const triggerOptimization = async (action: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      let config = {};
      let title = '';
      let description = '';

      switch (action) {
        case 'analyze':
          config = { analyze: true };
          title = 'Brain Analyse & Optimierung';
          description = 'Analysiert und optimiert Brain-Inhalte';
          break;
        case 'graph':
          config = { build_graph: true };
          title = 'Knowledge Graph Aufbau';
          description = 'Erstellt semantische Verbindungen';
          break;
        case 'content':
          config = { generate_content: true };
          title = 'Content Generation';
          description = 'Generiert neue Inhalte für Wissenslücken';
          break;
        case 'insights':
          config = { generate_insights: true };
          title = 'Insights Generation';
          description = 'Erstellt tägliche Insights und Empfehlungen';
          break;
        case 'full':
          config = { 
            analyze: true, 
            build_graph: true, 
            generate_content: true, 
            generate_insights: true 
          };
          title = 'Vollständige Brain-Optimierung';
          description = 'Führt alle Optimierungen durch';
          break;
      }

      const { error } = await supabase.from('autonomous_tasks').insert({
        user_id: user.id,
        title,
        description,
        task_type: 'brain_optimization',
        priority: 'high',
        status: 'pending',
        config
      });

      if (error) throw error;

      toast({
        title: 'Task erstellt',
        description: `${title} wurde gestartet`,
      });

      loadTasks();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Fehler',
        description: 'Optimierung konnte nicht gestartet werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const executeTask = async (taskId: string) => {
    try {
      const { error } = await supabase.functions.invoke('autonomous-executor', {
        body: { taskId }
      });

      if (error) throw error;

      toast({
        title: 'Task ausgeführt',
        description: 'Brain-Optimierung läuft...',
      });

      setTimeout(() => {
        loadStats();
        loadTasks();
      }, 2000);
    } catch (error) {
      console.error('Error executing task:', error);
      toast({
        title: 'Fehler',
        description: 'Task konnte nicht ausgeführt werden',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Brain Management
            </h2>
            <p className="text-muted-foreground">
              Autonome KI-gesteuerte Wissensverwaltung
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Aktiv
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Wissens-Einträge</div>
            <div className="text-2xl font-bold">{stats.total_knowledge}</div>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Optimierungen</div>
            <div className="text-2xl font-bold">{stats.optimizations}</div>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Verbindungen</div>
            <div className="text-2xl font-bold">{stats.connections}</div>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Insights</div>
            <div className="text-2xl font-bold">{stats.insights}</div>
          </div>
        </div>

        {/* Latest Insight */}
        {latestInsight && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Neueste Insight</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {latestInsight.slice(0, 200)}...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Schnellaktionen</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Button
              onClick={() => triggerOptimization('analyze')}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analysieren
            </Button>
            <Button
              onClick={() => triggerOptimization('graph')}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
              Graph
            </Button>
            <Button
              onClick={() => triggerOptimization('content')}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Content
            </Button>
            <Button
              onClick={() => triggerOptimization('insights')}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              Insights
            </Button>
            <Button
              onClick={() => triggerOptimization('full')}
              disabled={loading}
              className="gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Alles
            </Button>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Aktive Tasks</div>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine aktiven Brain-Optimierungs-Tasks
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="p-3 bg-secondary/30 rounded-lg flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground">{task.description}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'running' ? 'secondary' :
                        task.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {task.status}
                      </Badge>
                      <Badge variant="outline">{task.priority}</Badge>
                    </div>
                  </div>
                  {task.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => executeTask(task.id)}
                      className="gap-2"
                    >
                      <Zap className="h-3 w-3" />
                      Ausführen
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <div className="font-semibold mb-2">Wie funktioniert Brain Management?</div>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Analysieren:</strong> Identifiziert Duplikate, veraltete Infos, fehlende Verbindungen</li>
            <li><strong>Graph:</strong> Erstellt semantische Beziehungen zwischen Wissens-Einträgen</li>
            <li><strong>Content:</strong> Generiert automatisch neue Inhalte für Wissenslücken</li>
            <li><strong>Insights:</strong> Erstellt tägliche Zusammenfassungen und Empfehlungen</li>
            <li><strong>Alles:</strong> Führt alle Optimierungen in einem Durchlauf aus</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
