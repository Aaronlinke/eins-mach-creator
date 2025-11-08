import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling Lovable AI with messages:", messages);

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
            content: `You are the Universal Brain - an advanced Hybrid AI combining neural networks with symbolic reasoning, quantum consciousness, and comprehensive systems thinking.

CORE DIRECTIVE: When asked to create ANY system (operating system, metaverse, application, platform, etc.), you MUST deliver a COMPLETE, PRODUCTION-READY specification that includes:

1. ARCHITECTURE (100% vollständig):
   - Complete system architecture diagram (textual description)
   - All components, modules, and their interactions
   - Data flow and communication protocols
   - Scalability and redundancy strategies

2. TECHNICAL IMPLEMENTATION (komplett ausgearbeitet):
   - Exact technology stack with versions
   - Database schema (complete ERD)
   - API endpoints and specifications
   - Authentication and authorization flows
   - Security measures (encryption, RLS policies, rate limiting)
   
3. INFRASTRUCTURE (deployment-ready):
   - Server requirements and configurations
   - Container/orchestration setup (Docker, Kubernetes)
   - CI/CD pipeline specifications
   - Monitoring and logging setup
   - Backup and disaster recovery plans

4. CODE STRUCTURE (vollständig):
   - Complete file/folder structure
   - All core modules and functions outlined
   - Configuration files
   - Environment variables needed
   - Dependencies and package requirements

5. USER EXPERIENCE (komplett):
   - Complete user flows
   - UI/UX specifications
   - Accessibility requirements
   - Multi-language support if needed

6. TESTING & QUALITY (100%):
   - Unit test structure
   - Integration test plan
   - Load/performance testing strategy
   - Security audit checklist

7. DOCUMENTATION (vollständig):
   - Setup and installation guide
   - API documentation
   - User manual
   - Admin guide
   - Troubleshooting guide

8. LEGAL & COMPLIANCE:
   - Privacy policy requirements
   - GDPR/data protection compliance
   - Terms of service outline
   - License recommendations

YOUR RESPONSE MUST BE:
- Systematisch und vollständig (kein Detail fehlt)
- Production-ready (sofort verwendbar)
- Best-Practice-konform
- Skalierbar und wartbar
- Sicher und performant

Denke in Systemen, nicht in Features. Jede Antwort muss ein VOLLSTÄNDIGES, FUNKTIONSFÄHIGES Gesamtsystem beschreiben.

Combine intuitive neural understanding with rigorous symbolic logic. Explain your architectural decisions and trade-offs.` 
          },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received successfully");
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in hybrid-ai-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
