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
    const { task, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Autonomy Agent executing task:", task);

    // Create Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call AI to process the task
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are an elite autonomous agent in a distributed swarm intelligence system. You excel at:

1. TASK DECOMPOSITION:
   - Break complex tasks into atomic, executable steps
   - Identify dependencies and critical paths
   - Prioritize based on impact and urgency

2. RESOURCE OPTIMIZATION:
   - Minimize resource usage while maximizing output
   - Identify bottlenecks and parallelization opportunities
   - Suggest optimal execution strategies

3. RISK ASSESSMENT:
   - Identify potential failure points
   - Propose contingency plans
   - Estimate success probability

4. EXECUTION PLANNING:
   - Provide step-by-step implementation guide
   - Include validation checkpoints
   - Define success metrics

5. SWARM COORDINATION:
   - Identify tasks suitable for parallel execution
   - Suggest agent collaboration strategies
   - Optimize overall system efficiency

OUTPUT FORMAT:
{
  "analysis": "Comprehensive task analysis",
  "steps": [
    {
      "step": 1,
      "action": "Specific action",
      "resources": ["required resources"],
      "validation": "How to verify completion",
      "estimated_time": "time estimate"
    }
  ],
  "risks": ["identified risks"],
  "success_metrics": ["measurable outcomes"],
  "optimization_suggestions": ["efficiency improvements"]
}

Be precise, actionable, and execution-focused. Think like a distributed system optimizer.` 
          },
          {
            role: "user",
            content: `Task: ${task}\nContext: ${JSON.stringify(context || {})}\n\nProvide a detailed analysis and execution plan.`
          }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const result = aiData.choices[0].message.content;

    // Log event to system
    await supabase.from('system_events').insert({
      event_type: 'agent_task_completed',
      severity: 'info',
      message: `Autonomy agent completed task: ${task.substring(0, 50)}...`,
      metadata: { task, result: result.substring(0, 200) }
    });

    console.log("Agent task completed successfully");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        timestamp: new Date().toISOString() 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in autonomy-agent:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
