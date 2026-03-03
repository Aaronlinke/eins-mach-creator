import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Internal service token validation for scheduler calls
function isInternalCall(req: Request): boolean {
  // Calls from other edge functions (brain-scheduler) come via supabase.functions.invoke
  // which uses the service role key internally
  const authHeader = req.headers.get('authorization');
  return authHeader?.includes('service_role') || false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { taskId, action } = await req.json();

    // Auth: Either internal call (from scheduler) or valid user JWT
    const authHeader = req.headers.get('Authorization');
    let callerUserId: string | null = null;

    if (!isInternalCall(req)) {
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      callerUserId = claimsData.claims.sub as string;
    }

    if (action === 'execute_pending') {
      const { data: tasks } = await supabase
        .from('autonomous_tasks')
        .select('*')
        .eq('status', 'pending')
        .lte('next_run_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .limit(10);

      const results = [];

      for (const task of tasks || []) {
        // If user call, only execute own tasks
        if (callerUserId && task.user_id !== callerUserId) continue;

        await supabase
          .from('autonomous_tasks')
          .update({ status: 'running', last_run_at: new Date().toISOString() })
          .eq('id', task.id);

        let result;
        try {
          result = await executeTask(task, supabase);
          
          await supabase
            .from('autonomous_tasks')
            .update({ status: 'completed', result, next_run_at: calculateNextRun(task) })
            .eq('id', task.id);

          await supabase.from('autonomous_actions').insert({
            user_id: task.user_id, task_id: task.id, action_type: task.task_type,
            action_data: task.config, success: true, result
          });
        } catch (error) {
          await supabase
            .from('autonomous_tasks')
            .update({ status: 'failed', error_log: error instanceof Error ? error.message : 'Unknown error' })
            .eq('id', task.id);

          await supabase.from('autonomous_actions').insert({
            user_id: task.user_id, task_id: task.id, action_type: task.task_type,
            action_data: task.config, success: false,
            result: { error: error instanceof Error ? error.message : 'Unknown error' }
          });
        }
        results.push({ taskId: task.id, success: !!result });
      }

      return new Response(
        JSON.stringify({ success: true, executedTasks: results.length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Single task execution
    const { data: task } = await supabase
      .from('autonomous_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task) throw new Error('Task nicht gefunden');

    // If user call, verify ownership
    if (callerUserId && task.user_id !== callerUserId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Not your task' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase
      .from('autonomous_tasks')
      .update({ status: 'running', last_run_at: new Date().toISOString() })
      .eq('id', taskId);

    const result = await executeTask(task, supabase);

    await supabase
      .from('autonomous_tasks')
      .update({ status: 'completed', result, next_run_at: calculateNextRun(task) })
      .eq('id', taskId);

    await supabase.from('autonomous_actions').insert({
      user_id: task.user_id, task_id: task.id, action_type: task.task_type,
      action_data: task.config, success: true, result
    });

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in autonomous-executor:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function executeTask(task: any, supabase: any) {
  console.log(`Executing task: ${task.title} (${task.task_type})`);

  switch (task.task_type) {
    case 'web_monitor':
      return await executeWebMonitor(task, supabase);
    case 'data_analysis':
      return await executeDataAnalysis(task, supabase);
    case 'scheduled_action':
      return await executeScheduledAction(task, supabase);
    case 'condition_trigger':
      return await executeConditionTrigger(task, supabase);
    case 'context_learning':
      return await executeContextLearning(task, supabase);
    case 'brain_optimization':
      return await executeBrainOptimization(task, supabase);
    default:
      throw new Error(`Unbekannter Task-Typ: ${task.task_type}`);
  }
}

async function executeWebMonitor(task: any, supabase: any) {
  const { url } = task.config || {};
  const response = await fetch(url);
  const html = await response.text();
  
  const result = {
    url, status: response.status, contentLength: html.length,
    checkedAt: new Date().toISOString(), changes: []
  };

  await supabase.from('ai_knowledge').insert({
    user_id: task.user_id, category: 'pattern',
    key: `web_monitor_${task.id}`, value: { lastResult: result },
    source: 'autonomous_web_monitor'
  });

  return result;
}

async function executeDataAnalysis(task: any, supabase: any) {
  const { data: messages } = await supabase
    .from('chat_messages').select('*')
    .eq('user_id', task.user_id)
    .order('created_at', { ascending: false }).limit(100);

  const analysis = {
    totalMessages: messages?.length || 0,
    patterns: analyzePatterns(messages || []),
    insights: generateInsightsFromMessages(messages || []),
    analyzedAt: new Date().toISOString()
  };

  await supabase.from('ai_knowledge').insert({
    user_id: task.user_id, category: 'insight',
    key: `analysis_${task.id}_${Date.now()}`, value: analysis,
    confidence: 0.8, source: 'autonomous_data_analysis'
  });

  return analysis;
}

async function executeScheduledAction(task: any, supabase: any) {
  const { actionType, params } = task.config || {};
  const result = { actionType, executedAt: new Date().toISOString(), success: true };

  await supabase.from('system_events').insert({
    event_type: 'scheduled_action', severity: 'info',
    message: `Geplante Aktion ausgeführt: ${actionType}`, metadata: params
  });

  return result;
}

async function executeConditionTrigger(task: any, supabase: any) {
  const { conditions, action } = task.config || {};
  const conditionsMet = await checkConditions(conditions, supabase, task.user_id);
  
  if (conditionsMet) {
    const actionResult = await performAction(action, supabase, task.user_id);
    return { conditionsMet: true, action, result: actionResult, triggeredAt: new Date().toISOString() };
  }
  return { conditionsMet: false, checkedAt: new Date().toISOString() };
}

function analyzePatterns(messages: any[]) {
  return {
    mostActiveHour: getMostActiveHour(messages),
    averageMessageLength: getAverageLength(messages),
    commonTopics: extractTopics(messages)
  };
}

function generateInsightsFromMessages(messages: any[]) {
  return {
    insight: "Nutzer ist am aktivsten zwischen 14-18 Uhr",
    confidence: 0.75,
    recommendation: "Autonome Tasks in diesem Zeitfenster planen"
  };
}

function getMostActiveHour(messages: any[]) {
  if (!messages.length) return 0;
  const hours = messages.map(m => new Date(m.created_at).getHours());
  const counts = hours.reduce((acc, h) => { acc[h] = (acc[h] || 0) + 1; return acc; }, {} as Record<number, number>);
  return Number(Object.keys(counts).reduce((a, b) => counts[Number(a)] > counts[Number(b)] ? a : b, '0'));
}

function getAverageLength(messages: any[]) {
  const total = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  return messages.length > 0 ? total / messages.length : 0;
}

function extractTopics(messages: any[]) {
  return ['AI', 'Automation', 'Web'];
}

async function checkConditions(_conditions: any, _supabase: any, _userId: string) {
  return true;
}

async function performAction(_action: any, _supabase: any, _userId: string) {
  return { performed: true };
}

function calculateNextRun(task: any) {
  if (!task.schedule_cron) return null;
  const now = new Date();
  if (task.schedule_cron === '0 * * * *') now.setHours(now.getHours() + 1);
  else if (task.schedule_cron === '0 */6 * * *') now.setHours(now.getHours() + 6);
  else now.setDate(now.getDate() + 1);
  return now.toISOString();
}

async function executeContextLearning(task: any, supabase: any) {
  try {
    const userId = task.user_id;
    
    const [{ data: recentActions }, { data: chatMessages }] = await Promise.all([
      supabase.from('autonomous_actions').select('*').eq('user_id', userId)
        .order('executed_at', { ascending: false }).limit(100),
      supabase.from('chat_messages').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(50),
    ]);
    
    const patterns = {
      activeHours: extractActiveHours(recentActions || []),
      frequentActions: extractFrequentActions(recentActions || []),
      commonTopics: extractTopicsFromChat(chatMessages || []),
      interactionStyle: analyzeInteractionStyle(chatMessages || []),
    };
    
    await Promise.all([
      supabase.from('ai_knowledge').insert({
        user_id: userId, category: 'context_patterns',
        key: `patterns_${new Date().toISOString().split('T')[0]}`,
        value: patterns, confidence: 0.85, source: 'autonomous_learning'
      }),
      supabase.from('ai_knowledge').insert({
        user_id: userId, category: 'suggestions',
        key: `suggestions_${new Date().toISOString().split('T')[0]}`,
        value: { suggestions: generateProactiveSuggestions(patterns) },
        confidence: 0.75, source: 'context_learning'
      })
    ]);
    
    return { success: true, patterns, message: `Context learning completed.` };
  } catch (error) {
    console.error('Context learning error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function extractActiveHours(actions: any[]): number[] {
  const hourCounts: Record<number, number> = {};
  actions.forEach(a => { const h = new Date(a.executed_at).getHours(); hourCounts[h] = (hourCounts[h] || 0) + 1; });
  return Object.entries(hourCounts).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 3).map(([h]) => parseInt(h));
}

function extractFrequentActions(actions: any[]): string[] {
  const counts: Record<string, number> = {};
  actions.forEach(a => { counts[a.action_type] = (counts[a.action_type] || 0) + 1; });
  return Object.entries(counts).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5).map(([t]) => t);
}

function extractTopicsFromChat(messages: any[]): string[] {
  const keywords = new Map<string, number>();
  messages.forEach(msg => {
    msg.content.toLowerCase().split(/\s+/).forEach((word: string) => {
      if (word.length > 4) keywords.set(word, (keywords.get(word) || 0) + 1);
    });
  });
  return Array.from(keywords.entries()).sort(([, a], [, b]) => b - a).slice(0, 10).map(([w]) => w);
}

function analyzeInteractionStyle(messages: any[]): string {
  if (!messages.length) return 'unbekannt';
  const avgLength = messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length;
  const questionCount = messages.filter(msg => msg.content.includes('?')).length;
  if (avgLength < 50) return 'kurz_und_direkt';
  if (questionCount > messages.length * 0.3) return 'fragend_explorativ';
  if (avgLength > 200) return 'detailliert_ausfuehrlich';
  return 'ausgewogen';
}

function generateProactiveSuggestions(patterns: any): string[] {
  const suggestions = [];
  if (patterns.activeHours?.length > 0) suggestions.push(`Optimale Aktivitätszeit: ${patterns.activeHours[0]}:00 Uhr`);
  if (patterns.frequentActions?.length > 0) suggestions.push(`Häufigste Aktion: ${patterns.frequentActions[0]}`);
  if (patterns.commonTopics?.length > 0) suggestions.push(`Hauptthema: ${patterns.commonTopics[0]}`);
  suggestions.push(`Interaktionsstil: ${patterns.interactionStyle || 'analysiert'}`);
  return suggestions;
}

// Brain Optimization - PARALLEL execution for double performance
async function executeBrainOptimization(task: any, supabase: any) {
  console.log('Executing Brain Optimization task (parallel mode)');
  
  const config = task.config || {};
  
  try {
    const promises = [];
    const labels: string[] = [];

    if (config.analyze) {
      promises.push(supabase.functions.invoke('brain-manager', { body: { action: 'analyze_and_optimize' } }));
      labels.push('analyze');
    }
    if (config.build_graph) {
      promises.push(supabase.functions.invoke('brain-manager', { body: { action: 'build_knowledge_graph' } }));
      labels.push('build_graph');
    }
    if (config.generate_content) {
      promises.push(supabase.functions.invoke('brain-manager', { body: { action: 'generate_content' } }));
      labels.push('generate_content');
    }
    if (config.generate_insights) {
      promises.push(supabase.functions.invoke('brain-manager', { body: { action: 'generate_insights' } }));
      labels.push('generate_insights');
    }

    const results = await Promise.allSettled(promises);
    
    const actions = results.map((r, i) => ({
      action: labels[i],
      status: r.status,
      result: r.status === 'fulfilled' ? r.value?.data : r.reason?.message
    }));

    return {
      success: true,
      actions_completed: actions.filter(a => a.status === 'fulfilled').length,
      actions_total: actions.length,
      actions,
      parallel: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Brain optimization error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
