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

    console.log('🤖 Brain Scheduler: Checking for pending brain optimization tasks...');

    // Check if there are any pending or running brain_optimization tasks
    const { data: existingTasks, error: checkError } = await supabase
      .from('autonomous_tasks')
      .select('*')
      .eq('task_type', 'brain_optimization')
      .in('status', ['pending', 'running']);

    if (checkError) {
      console.error('Error checking tasks:', checkError);
      throw checkError;
    }

    // If there's already a task running, skip
    if (existingTasks && existingTasks.length > 0) {
      console.log(`⏸️ Brain Scheduler: Skipping - ${existingTasks.length} task(s) already active`);
      return new Response(
        JSON.stringify({ 
          message: 'Task already running', 
          activeTasksCount: existingTasks.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get a random user_id from profiles (for system tasks)
    // In production, you might want to use a specific system user
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

    const userId = profiles.id;

    // Create a new full brain optimization task
    const { data: newTask, error: insertError } = await supabase
      .from('autonomous_tasks')
      .insert({
        user_id: userId,
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

    if (insertError) {
      console.error('Error creating task:', insertError);
      throw insertError;
    }

    console.log('✅ Brain Scheduler: Created new task:', newTask.id);

    // Immediately execute the task
    const { error: executeError } = await supabase.functions.invoke('autonomous-executor', {
      body: { taskId: newTask.id }
    });

    if (executeError) {
      console.error('Error executing task:', executeError);
      // Don't throw - task is created, it can be executed later
    } else {
      console.log('🚀 Brain Scheduler: Task execution started');
    }

    return new Response(
      JSON.stringify({ 
        message: 'Brain optimization scheduled and started', 
        taskId: newTask.id 
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
