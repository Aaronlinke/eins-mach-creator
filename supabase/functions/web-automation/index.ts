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
    const { action, url, selector, data } = await req.json();
    
    console.log("Web Automation Request:", { action, url });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    switch (action) {
      case 'scrape':
        // Einfaches Scraping mit fetch
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const html = await response.text();
        
        // Extrahiere Text-Content (vereinfacht)
        const textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        result = {
          url,
          title: html.match(/<title>([^<]*)<\/title>/i)?.[1] || 'Unbekannt',
          content: textContent.substring(0, 5000), // Erste 5000 Zeichen
          extractedAt: new Date().toISOString(),
        };
        break;

      case 'extract_links':
        const linkResponse = await fetch(url);
        const linkHtml = await linkResponse.text();
        
        // Extrahiere alle Links
        const linkMatches = linkHtml.matchAll(/<a[^>]+href="([^"]+)"/gi);
        const links = Array.from(linkMatches).map(match => match[1]);
        
        result = {
          url,
          links: links.slice(0, 100), // Erste 100 Links
          count: links.length,
        };
        break;

      case 'monitor':
        // Website-Monitoring
        const monitorResponse = await fetch(url);
        const monitorHtml = await monitorResponse.text();
        
        result = {
          url,
          status: monitorResponse.status,
          statusText: monitorResponse.statusText,
          contentLength: monitorHtml.length,
          responseTime: monitorResponse.headers.get('x-response-time'),
          checkedAt: new Date().toISOString(),
        };
        break;

      default:
        throw new Error(`Unbekannte Aktion: ${action}`);
    }

    // Log Event
    await supabase.from('system_events').insert({
      event_type: 'web_automation',
      severity: 'info',
      message: `Web Automation: ${action} auf ${url}`,
      metadata: { action, url, resultPreview: JSON.stringify(result).substring(0, 200) }
    });

    console.log("Web Automation erfolgreich:", action);

    return new Response(
      JSON.stringify({ 
        success: true, 
        action,
        result,
        timestamp: new Date().toISOString() 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in web-automation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
