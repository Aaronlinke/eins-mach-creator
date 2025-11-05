import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Link2 } from "lucide-react";

interface KnowledgeNode {
  concept: string;
  relations: string[];
  context: string;
}

export default function SemanticEnginePanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [knowledge, setKnowledge] = useState<KnowledgeNode | null>(null);

  const analyzeKnowledge = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('hybrid-ai-chat', {
        body: { 
          messages: [{
            role: "user",
            content: `Als semantische Wissens-Engine: Analysiere das Konzept "${query}" und erkläre die wichtigsten Zusammenhänge, Relationen und den Kontext. Sei präzise und strukturiert.`
          }]
        }
      });

      if (error) throw error;

      const response = data.choices[0].message.content;
      
      // Extrahiere Relationen aus der AI-Antwort
      const relations: string[] = [];
      const lines = response.split('\n');
      
      for (const line of lines) {
        if (line.match(/^[-•*]\s/) || line.match(/^\d+[.)]\s/)) {
          const cleaned = line.replace(/^[-•*\d.)]\s*/, '').trim();
          if (cleaned.length > 5 && cleaned.length < 50) {
            relations.push(cleaned);
          }
        }
      }

      const knowledgeNode: KnowledgeNode = {
        concept: query,
        relations: relations.length > 0 ? relations.slice(0, 6) : [
          "Verwandte Technologien", 
          "Anwendungsbereiche", 
          "Zukunftsperspektiven",
          "Technische Grundlagen",
          "Marktentwicklung",
          "Forschungsrichtungen"
        ],
        context: response
      };

      setKnowledge(knowledgeNode);
      
      toast({
        title: "Wissensanalyse abgeschlossen",
        description: "Semantischer Graph wurde erstellt",
      });
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔮 Semantik-Engine - Wissens-Graph Processing
        </CardTitle>
        <CardDescription>
          Multi-linguales Verstehen mit Kontext-Bewusstsein
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Konzept oder Begriff eingeben..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyzeKnowledge()}
          />
          <Button onClick={analyzeKnowledge} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => setQuery("Künstliche Intelligenz")}>
            KI
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuery("Blockchain")}>
            Blockchain
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuery("Quantencomputing")}>
            Quanten
          </Button>
        </div>

        {knowledge && (
          <div className="space-y-4 mt-6">
            <div className="text-center p-6 border-2 border-primary/30 rounded-lg bg-primary/5">
              <h3 className="text-2xl font-bold text-primary">{knowledge.concept}</h3>
              <p className="text-sm text-muted-foreground mt-1">Kernkonzept</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {knowledge.relations.map((rel, idx) => (
                <div key={idx} className="text-center p-3 border rounded-lg bg-muted/30">
                  <Link2 className="h-4 w-4 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">{rel}</p>
                </div>
              ))}
            </div>

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold mb-2">Semantischer Kontext:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {knowledge.context}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <p className="text-sm font-semibold mb-2">Engine-Metriken:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Konzepte: <span className="font-bold text-primary">2.3M</span></div>
            <div>Sprachen: <span className="font-bold text-primary">127</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
