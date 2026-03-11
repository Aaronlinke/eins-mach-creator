import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1', ''].includes(hostname)) return true;
    if (hostname === '169.254.169.254') return true;
    if (hostname.endsWith('.internal') || hostname.endsWith('.local')) return true;
    const parts = hostname.split('.').map(Number);
    if (parts.length === 4 && parts.every(p => !isNaN(p))) {
      if (parts[0] === 10) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      if (parts[0] === 169 && parts[1] === 254) return true;
    }
    if (!['http:', 'https:'].includes(url.protocol)) return true;
    return false;
  } catch {
    return true;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, url, selector, data } = await req.json();
    
    if (url && isPrivateUrl(url)) {
      return new Response(
        JSON.stringify({ error: 'URL nicht erlaubt: Interne/private Adressen sind blockiert' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Web Automation Request:", { action, url });

    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    switch (action) {
      case 'scrape': {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const html = await response.text();
        const textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        result = {
          url,
          title: html.match(/<title>([^<]*)<\/title>/i)?.[1] || 'Unbekannt',
          content: textContent.substring(0, 5000),
          extractedAt: new Date().toISOString(),
        };
        break;
      }
      case 'extract_links': {
        const linkResponse = await fetch(url);
        const linkHtml = await linkResponse.text();
        const linkMatches = linkHtml.matchAll(/<a[^>]+href="([^"]+)"/gi);
        const links = Array.from(linkMatches).map(match => match[1]);
        result = { url, links: links.slice(0, 100), count: links.length };
        break;
      }
      case 'monitor': {
        const monitorResponse = await fetch(url);
        const monitorHtml = await monitorResponse.text();
        result = {
          url, status: monitorResponse.status, statusText: monitorResponse.statusText,
          contentLength: monitorHtml.length,
          responseTime: monitorResponse.headers.get('x-response-time'),
          checkedAt: new Date().toISOString(),
        };
        break;
      }
      default:
        throw new Error(`Unbekannte Aktion: ${action}`);
    }

    await supabase.from('system_events').insert({
      event_type: 'web_automation', severity: 'info',
      message: `Web Automation: ${action} auf ${url}`,
      metadata: { action, url, resultPreview: JSON.stringify(result).substring(0, 200) }
    });

    return new Response(
      JSON.stringify({ success: true, action, result, timestamp: new Date().toISOString() }),
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
