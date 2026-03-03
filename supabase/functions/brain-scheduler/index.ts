import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🤖 Brain Scheduler: Starting cleanup and scheduling...');

    // Step 1: Clean up stale running tasks (>30 min)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: staleRunning } = await supabase
      .from('autonomous_tasks')
      .update({ 
        status: 'failed', 
        error_log: 'Timeout - automatisch bereinigt nach 30 Minuten' 
      })
      .eq('status', 'running')
      .lt('last_run_at', thirtyMinAgo)
      .select('id');

    if (staleRunning?.length) {
      console.log(`🧹 Cleaned ${staleRunning.length} stale running task(s)`);
    }

    // Step 2: Clean up stale pending tasks (>1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: stalePending } = await supabase
      .from('autonomous_tasks')
      .delete()
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo)
      .select('id');

    if (stalePending?.length) {
      console.log(`🧹 Deleted ${stalePending.length} stale pending task(s)`);
    }

    // Step 3: Check for active brain_optimization tasks
    const { data: existingTasks, error: checkError } = await supabase
      .from('autonomous_tasks')
      .select('*')
      .eq('task_type', 'brain_optimization')
      .in('status', ['pending', 'running']);

    if (checkError) {
      console.error('Error checking tasks:', checkError);
      throw checkError;
    }

    if (existingTasks && existingTasks.length > 0) {
      console.log(`⏸️ Brain Scheduler: Skipping - ${existingTasks.length} task(s) already active`);
      return new Response(
        JSON.stringify({ 
          message: 'Task already running', 
          activeTasksCount: existingTasks.length,
          cleanedRunning: staleRunning?.length || 0,
          cleanedPending: stalePending?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Get system user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!profiles) {
      console.log('⚠️ No user found - skipping task creation');
      return new Response(
        JSON.stringify({ message: 'No user found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Create and execute new task
    const { data: newTask, error: insertError } = await supabase
      .from('autonomous_tasks')
      .insert({
        user_id: profiles.id,
        title: 'Automatische Brain-Optimierung',
        description: 'Regelmäßige KI-gesteuerte Optimierung des Wissenssystems',
        task_type: 'brain_optimization',
        priority: 'high',
        status: 'pending',
        config: {
          analyze: true,
          build_graph: true,
          generate_content: true,
          generate_insights: true,
          auto_scheduled: true
        }
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('✅ Brain Scheduler: Created new task:', newTask.id);

    const { error: executeError } = await supabase.functions.invoke('autonomous-executor', {
      body: { taskId: newTask.id }
    });

    if (executeError) {
      console.error('Error executing task:', executeError);
    } else {
      console.log('🚀 Brain Scheduler: Task execution started');
    }

    return new Response(
      JSON.stringify({ 
        message: 'Brain optimization scheduled and started', 
        taskId: newTask.id,
        cleanedRunning: staleRunning?.length || 0,
        cleanedPending: stalePending?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Brain Scheduler Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
