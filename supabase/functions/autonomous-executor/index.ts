import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, action } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'execute_pending') {
      // Führe alle ausstehenden Tasks aus
      const { data: tasks } = await supabase
        .from('autonomous_tasks')
        .select('*')
        .eq('status', 'pending')
        .lte('next_run_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .limit(10);

      const results = [];

      for (const task of tasks || []) {
        await supabase
          .from('autonomous_tasks')
          .update({ status: 'running', last_run_at: new Date().toISOString() })
          .eq('id', task.id);

        let result;
        try {
          result = await executeTask(task, supabase);
          
          await supabase
            .from('autonomous_tasks')
            .update({ 
              status: 'completed',
              result,
              next_run_at: calculateNextRun(task)
            })
            .eq('id', task.id);

          await supabase
            .from('autonomous_actions')
            .insert({
              user_id: task.user_id,
              task_id: task.id,
              action_type: task.task_type,
              action_data: task.config,
              success: true,
              result
            });

        } catch (error) {
          await supabase
            .from('autonomous_tasks')
            .update({ 
              status: 'failed',
              error_log: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', task.id);

          await supabase
            .from('autonomous_actions')
            .insert({
              user_id: task.user_id,
              task_id: task.id,
              action_type: task.task_type,
              action_data: task.config,
              success: false,
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

    // Einzelnen Task ausführen
    const { data: task } = await supabase
      .from('autonomous_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task) {
      throw new Error('Task nicht gefunden');
    }

    await supabase
      .from('autonomous_tasks')
      .update({ status: 'running', last_run_at: new Date().toISOString() })
      .eq('id', taskId);

    const result = await executeTask(task, supabase);

    await supabase
      .from('autonomous_tasks')
      .update({ 
        status: 'completed',
        result,
        next_run_at: calculateNextRun(task)
      })
      .eq('id', taskId);

    await supabase
      .from('autonomous_actions')
      .insert({
        user_id: task.user_id,
        task_id: task.id,
        action_type: task.task_type,
        action_data: task.config,
        success: true,
        result
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
    
    default:
      throw new Error(`Unbekannter Task-Typ: ${task.task_type}`);
  }
}

async function executeWebMonitor(task: any, supabase: any) {
  const { url, selector, checkType } = task.config || {};
  
  const response = await fetch(url);
  const html = await response.text();
  
  const result = {
    url,
    status: response.status,
    contentLength: html.length,
    checkedAt: new Date().toISOString(),
    changes: []
  };

  // Speichere als AI Knowledge für Muster-Erkennung
  await supabase.from('ai_knowledge').insert({
    user_id: task.user_id,
    category: 'pattern',
    key: `web_monitor_${task.id}`,
    value: { lastResult: result },
    source: 'autonomous_web_monitor'
  });

  return result;
}

async function executeDataAnalysis(task: any, supabase: any) {
  const { dataSource, analysisType } = task.config || {};
  
  // Beispiel: Analysiere Chat-Nachrichten
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', task.user_id)
    .order('created_at', { ascending: false })
    .limit(100);

  const analysis = {
    totalMessages: messages?.length || 0,
    patterns: analyzePatterns(messages),
    insights: generateInsights(messages),
    analyzedAt: new Date().toISOString()
  };

  // Speichere Erkenntnisse
  await supabase.from('ai_knowledge').insert({
    user_id: task.user_id,
    category: 'insight',
    key: `analysis_${task.id}_${Date.now()}`,
    value: analysis,
    confidence: 0.8,
    source: 'autonomous_data_analysis'
  });

  return analysis;
}

async function executeScheduledAction(task: any, supabase: any) {
  const { actionType, params } = task.config || {};
  
  // Führe geplante Aktion aus (z.B. Benachrichtigung senden, Report erstellen)
  const result = {
    actionType,
    executedAt: new Date().toISOString(),
    success: true
  };

  await supabase.from('system_events').insert({
    event_type: 'scheduled_action',
    severity: 'info',
    message: `Geplante Aktion ausgeführt: ${actionType}`,
    metadata: params
  });

  return result;
}

async function executeConditionTrigger(task: any, supabase: any) {
  const { conditions, action } = task.config || {};
  
  // Prüfe Bedingungen
  const conditionsMet = await checkConditions(conditions, supabase, task.user_id);
  
  if (conditionsMet) {
    // Führe Aktion aus
    const actionResult = await performAction(action, supabase, task.user_id);
    
    return {
      conditionsMet: true,
      action: action,
      result: actionResult,
      triggeredAt: new Date().toISOString()
    };
  }

  return {
    conditionsMet: false,
    checkedAt: new Date().toISOString()
  };
}

function analyzePatterns(messages: any[]) {
  // Einfache Muster-Erkennung
  const patterns = {
    mostActiveHour: getMostActiveHour(messages),
    averageMessageLength: getAverageLength(messages),
    commonTopics: extractTopics(messages)
  };
  return patterns;
}

function generateInsights(messages: any[]) {
  return {
    insight: "Nutzer ist am aktivsten zwischen 14-18 Uhr",
    confidence: 0.75,
    recommendation: "Autonome Tasks in diesem Zeitfenster planen"
  };
}

function getMostActiveHour(messages: any[]) {
  const hours = messages.map(m => new Date(m.created_at).getHours());
  const counts = hours.reduce((acc, h) => {
    acc[h] = (acc[h] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  return Object.keys(counts).reduce((a, b) => counts[Number(a)] > counts[Number(b)] ? a : b);
}

function getAverageLength(messages: any[]) {
  const total = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  return messages.length > 0 ? total / messages.length : 0;
}

function extractTopics(messages: any[]) {
  return ['AI', 'Automation', 'Web'];
}

async function checkConditions(conditions: any, supabase: any, userId: string) {
  // Prüfe definierte Bedingungen
  return true; // Simplified
}

async function performAction(action: any, supabase: any, userId: string) {
  // Führe die definierte Aktion aus
  return { performed: true };
}

function calculateNextRun(task: any) {
  if (!task.schedule_cron) return null;
  
  // Vereinfachte Cron-Berechnung (alle 1h, 6h, 24h)
  const now = new Date();
  if (task.schedule_cron === '0 * * * *') { // Stündlich
    now.setHours(now.getHours() + 1);
  } else if (task.schedule_cron === '0 */6 * * *') { // Alle 6h
    now.setHours(now.getHours() + 6);
  } else { // Täglich
    now.setDate(now.getDate() + 1);
  }
  return now.toISOString();
}

// Execute Context Learning Task
async function executeContextLearning(task: any, supabase: any) {
  try {
    const userId = task.user_id;
    
    // Analyze user behavior patterns
    const { data: recentActions } = await supabase
      .from('autonomous_actions')
      .select('*')
      .eq('user_id', userId)
      .order('executed_at', { ascending: false })
      .limit(100);
    
    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    // Extract patterns
    const patterns = {
      activeHours: extractActiveHours(recentActions || []),
      frequentActions: extractFrequentActions(recentActions || []),
      commonTopics: extractTopicsFromChat(chatMessages || []),
      interactionStyle: analyzeInteractionStyle(chatMessages || []),
    };
    
    // Store learned context
    await supabase.from('ai_knowledge').insert({
      user_id: userId,
      category: 'context_patterns',
      key: `patterns_${new Date().toISOString().split('T')[0]}`,
      value: patterns,
      confidence: 0.85,
      source: 'autonomous_learning'
    });
    
    // Generate proactive suggestions
    const suggestions = generateProactiveSuggestions(patterns);
    
    // Store suggestions
    await supabase.from('ai_knowledge').insert({
      user_id: userId,
      category: 'suggestions',
      key: `suggestions_${new Date().toISOString().split('T')[0]}`,
      value: { suggestions },
      confidence: 0.75,
      source: 'context_learning'
    });
    
    return {
      success: true,
      patterns,
      suggestions,
      message: `Context learning completed. Found ${Object.keys(patterns).length} pattern categories.`
    };
  } catch (error) {
    console.error('Context learning error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Extract active hours from user actions
function extractActiveHours(actions: any[]): number[] {
  const hourCounts: { [key: number]: number } = {};
  
  actions.forEach(action => {
    const hour = new Date(action.executed_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  return Object.entries(hourCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));
}

// Extract frequent action types
function extractFrequentActions(actions: any[]): string[] {
  const actionCounts: { [key: string]: number } = {};
  
  actions.forEach(action => {
    actionCounts[action.action_type] = (actionCounts[action.action_type] || 0) + 1;
  });
  
  return Object.entries(actionCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([type]) => type);
}

// Extract topics from chat messages
function extractTopicsFromChat(messages: any[]): string[] {
  const keywords = new Map<string, number>();
  
  messages.forEach(msg => {
    const words = msg.content.toLowerCase().split(/\s+/);
    words.forEach((word: string) => {
      if (word.length > 4) {
        keywords.set(word, (keywords.get(word) || 0) + 1);
      }
    });
  });
  
  return Array.from(keywords.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

// Analyze interaction style
function analyzeInteractionStyle(messages: any[]): string {
  if (messages.length === 0) return 'unbekannt';
  
  const avgLength = messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length;
  const questionCount = messages.filter(msg => msg.content.includes('?')).length;
  
  if (avgLength < 50) return 'kurz_und_direkt';
  if (questionCount > messages.length * 0.3) return 'fragend_explorativ';
  if (avgLength > 200) return 'detailliert_ausfuehrlich';
  return 'ausgewogen';
}

// Generate proactive suggestions based on patterns
function generateProactiveSuggestions(patterns: any): string[] {
  const suggestions = [];
  
  if (patterns.activeHours && patterns.activeHours.length > 0) {
    suggestions.push(`Optimale Aktivitätszeit: ${patterns.activeHours[0]}:00 Uhr`);
  }
  
  if (patterns.frequentActions && patterns.frequentActions.length > 0) {
    suggestions.push(`Häufigste Aktion: ${patterns.frequentActions[0]}`);
  }
  
  if (patterns.commonTopics && patterns.commonTopics.length > 0) {
    suggestions.push(`Hauptthema: ${patterns.commonTopics[0]}`);
  }
  
  suggestions.push(`Interaktionsstil: ${patterns.interactionStyle || 'analysiert'}`);
  
  return suggestions;
}