import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Search, Link2, Monitor, Loader2 } from 'lucide-react';

export const WebAutomationPanel = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const executeAutomation = async (action: string) => {
    if (!url) {
      toast({
        title: "URL fehlt",
        description: "Bitte gib eine URL ein",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('web-automation', {
        body: { action, url }
      });

      if (error) throw error;

      setResult(data.result);
      toast({
        title: "Automation erfolgreich!",
        description: `${action} abgeschlossen für ${url}`,
      });
    } catch (error) {
      console.error('Automation Error:', error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Automation fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Web Automation</h2>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />

        <Tabs defaultValue="scrape" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scrape">
              <Search className="h-4 w-4 mr-2" />
              Scrape
            </TabsTrigger>
            <TabsTrigger value="links">
              <Link2 className="h-4 w-4 mr-2" />
              Links
            </TabsTrigger>
            <TabsTrigger value="monitor">
              <Monitor className="h-4 w-4 mr-2" />
              Monitor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scrape" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Extrahiere Text-Content von einer Website
            </p>
            <Button 
              onClick={() => executeAutomation('scrape')} 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Website Scrapen
            </Button>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sammle alle Links von einer Website
            </p>
            <Button 
              onClick={() => executeAutomation('extract_links')} 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Links Extrahieren
            </Button>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Überwache Website-Status und Performance
            </p>
            <Button 
              onClick={() => executeAutomation('monitor')} 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Status Checken
            </Button>
          </TabsContent>
        </Tabs>

        {result && (
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Ergebnis:</h3>
            <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </Card>
  );
};
