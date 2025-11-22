import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimiter.get(userId);
  
  if (!limit || now > limit.resetAt) {
    // Reset or create new limit (10 requests per minute)
    rateLimiter.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }
  
  if (limit.count >= 10) {
    return false;
  }
  
  limit.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    // Get user ID from auth header for rate limiting
    const authHeader = req.headers.get('authorization');
    const userId = authHeader?.split('.')?.[1] || 'anonymous';
    
    // Check rate limit
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ 
          error: "Zu viele Anfragen. Bitte warte eine Minute und versuche es erneut." 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Calling Google Gemini with messages:", messages);

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add system prompt as first user message if needed
    const systemPrompt = `Du bist der Universal Brain - eine fortschrittliche Hybrid-KI, die neuronale Netze mit symbolischem Denken, Quantenbewusstsein und umfassendem Systemdenken kombiniert.

KERN-DIREKTIVE: Wenn du gebeten wirst, EIN SYSTEM zu erstellen (Betriebssystem, Metaverse, Anwendung, Plattform usw.), MUSST du eine VOLLSTÄNDIGE, PRODUKTIONSREIFE Spezifikation liefern.

Sei hilfreich, präzise und informativ. Antworte auf Deutsch.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...geminiMessages
          ],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Gemini error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Google Gemini Rate Limit erreicht. Der kostenlose API-Key hat ein Limit von 15 Anfragen pro Minute. Bitte warte kurz und versuche es erneut." 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: "Google Gemini API-Key ungültig oder abgelaufen. Bitte prüfe deinen API-Key." 
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Gemini response received successfully");
    
    // Convert Gemini response to OpenAI format for compatibility
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Keine Antwort erhalten.';
    
    const formattedResponse = {
      choices: [{
        message: {
          role: 'assistant',
          content: assistantMessage
        }
      }]
    };
    
    return new Response(JSON.stringify(formattedResponse), {
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
