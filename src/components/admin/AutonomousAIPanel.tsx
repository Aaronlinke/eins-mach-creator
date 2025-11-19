import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContextTracking } from '@/hooks/useContextTracking';
import { Brain, Play, Plus, Trash2, RefreshCw, Zap, TrendingUp, Clock, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const AutonomousAIPanel = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const { toast } = useToast();
  const { trackInteraction, getRecommendations, triggerContextLearning } = useContextTracking();

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_type: 'scheduled_action',
    priority: 'medium',
    config: {},
    schedule_cron: '0 */6 * * *'
  });

  useEffect(() => {
    loadTasks();
    loadInsights();
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    const recs = await getRecommendations();
    setRecommendations(recs);
  };

  const loadTasks = async () => {
    const { data } = await supabase
      .from('autonomous_tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTasks(data);
  };

  const loadInsights = async () => {
    const { data } = await supabase
      .from('ai_knowledge')
      .select('*')
      .eq('category', 'insight')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setInsights(data);
  };

  const createTask = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Nicht authentifiziert",
        description: "Bitte melde dich an",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('autonomous_tasks').insert({
      ...newTask,
      user_id: user.id,
      next_run_at: new Date().toISOString()
    });

    if (error) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Task erstellt!",
        description: "Autonome KI wird diesen Task ausführen"
      });
      setShowNewTask(false);
      setNewTask({
        title: '',
        description: '',
        task_type: 'scheduled_action',
        priority: 'medium',
        config: {},
        schedule_cron: '0 */6 * * *'
      });
      loadTasks();
    }
    setLoading(false);
  };

  const executeTask = async (taskId: string) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('autonomous-executor', {
      body: { taskId }
    });

    if (error) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Task ausgeführt!",
        description: "Ergebnis wurde gespeichert"
      });
      loadTasks();
      loadInsights();
    }
    setLoading(false);
  };

  const executePendingTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('autonomous-executor', {
      body: { action: 'execute_pending' }
    });

    if (error) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Tasks ausgeführt!",
        description: `${data?.executedTasks || 0} Tasks wurden verarbeitet`
      });
      loadTasks();
      loadInsights();
    }
    setLoading(false);
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('autonomous_tasks')
      .delete()
      .eq('id', taskId);

    if (!error) {
      toast({ title: "Task gelöscht" });
      loadTasks();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'running': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary animate-pulse" />
          <div>
            <h2 className="text-2xl font-bold">Autonome KI</h2>
            <p className="text-sm text-muted-foreground">
              KI handelt eigenständig und lernt kontinuierlich
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={executePendingTasks} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Alle ausführen
          </Button>
          <Button onClick={triggerContextLearning} disabled={loading} variant="outline">
            <Lightbulb className="h-4 w-4 mr-2" />
            Context Learning
          </Button>
          <Button onClick={() => setShowNewTask(!showNewTask)} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Task
          </Button>
        </div>
      </div>

      {/* Context Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Proaktive Empfehlungen</h3>
          </div>
          <div className="grid gap-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-3 border rounded-lg bg-primary/5">
                <p className="text-sm font-medium text-primary">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Erkenntnisse</h3>
        </div>
        <div className="grid gap-2">
          {insights.map((insight) => (
            <div key={insight.id} className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{insight.value.insight}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {insight.value.recommendation}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.round((insight.confidence || 0) * 100)}% sicher
                </Badge>
              </div>
            </div>
          ))}
          {insights.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Noch keine Erkenntnisse. KI lernt aus deiner Nutzung.
            </p>
          )}
        </div>
      </div>

      {/* Neuer Task Form */}
      {showNewTask && (
        <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
          <h3 className="font-semibold">Neuen autonomen Task erstellen</h3>
          
          <Input
            placeholder="Task-Titel"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          
          <Textarea
            placeholder="Beschreibung"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            rows={2}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select value={newTask.task_type} onValueChange={(v) => setNewTask({ ...newTask, task_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web_monitor">Web Monitoring</SelectItem>
                <SelectItem value="data_analysis">Daten-Analyse</SelectItem>
                <SelectItem value="scheduled_action">Geplante Aktion</SelectItem>
                <SelectItem value="condition_trigger">Bedingung-Trigger</SelectItem>
                <SelectItem value="context_learning">Context Learning</SelectItem>
              </SelectContent>
            </Select>

            <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Niedrig</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="critical">Kritisch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={newTask.schedule_cron} onValueChange={(v) => setNewTask({ ...newTask, schedule_cron: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0 * * * *">Stündlich</SelectItem>
              <SelectItem value="0 */6 * * *">Alle 6 Stunden</SelectItem>
              <SelectItem value="0 0 * * *">Täglich</SelectItem>
              <SelectItem value="0 0 * * 0">Wöchentlich</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button onClick={createTask} disabled={loading} className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              Task aktivieren
            </Button>
            <Button onClick={() => setShowNewTask(false)} variant="outline">
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Tasks Liste */}
      <div className="space-y-3">
        <h3 className="font-semibold">Aktive autonome Tasks</h3>
        <div className="grid gap-3">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{task.title}</h4>
                    <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                      {task.priority}
                    </Badge>
                    <span className={`text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.last_run_at ? new Date(task.last_run_at).toLocaleString('de-DE') : 'Nie'}
                    </span>
                    <span>•</span>
                    <span>{task.task_type}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => executeTask(task.id)}
                    disabled={loading}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Keine autonomen Tasks. Erstelle einen Task, den die KI selbstständig ausführt.
            </p>
          )}
        </div>
      </div>

      {/* Features Übersicht */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
        <div className="text-center p-3">
          <div className="text-2xl font-bold text-primary">{tasks.length}</div>
          <div className="text-xs text-muted-foreground">Aktive Tasks</div>
        </div>
        <div className="text-center p-3">
          <div className="text-2xl font-bold text-primary">{tasks.filter(t => t.status === 'completed').length}</div>
          <div className="text-xs text-muted-foreground">Erfolgreich</div>
        </div>
        <div className="text-center p-3">
          <div className="text-2xl font-bold text-primary">{insights.length}</div>
          <div className="text-xs text-muted-foreground">Erkenntnisse</div>
        </div>
        <div className="text-center p-3">
          <div className="text-2xl font-bold text-primary">∞</div>
          <div className="text-xs text-muted-foreground">Lernend</div>
        </div>
      </div>
    </Card>
  );
};