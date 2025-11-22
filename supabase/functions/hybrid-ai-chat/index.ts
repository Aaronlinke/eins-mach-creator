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
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
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
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
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
