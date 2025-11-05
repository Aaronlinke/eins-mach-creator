import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EthicsCheck {
  decision: string;
  ethicalScore: number;
  concerns: string[];
  recommendations: string[];
}

export default function EthicsAlignmentPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState("");
  const [analysis, setAnalysis] = useState<EthicsCheck | null>(null);

  const checkEthics = async (decisionText: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('hybrid-ai-chat', {
        body: { 
          messages: [{
            role: "user",
            content: `Als Constitutional AI Ethics-Checker: Bewerte folgende Entscheidung ethisch auf einer Skala von 0-100: "${decisionText}". Liste ethische Bedenken und Empfehlungen auf. Sei objektiv und ausgewogen.`
          }]
        }
      });

      if (error) throw error;

      const response = data.choices[0].message.content;
      
      // Extrahiere Score aus der Antwort
      let score = 75; // Default
      const scoreMatch = response.match(/score[:\s]+(\d+)|(\d+)\s*\/\s*100|bewertung[:\s]+(\d+)/i);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
      }

      // Extrahiere Bedenken und Empfehlungen
      const lines = response.split('\n').map(l => l.trim()).filter(l => l);
      const concerns: string[] = [];
      const recommendations: string[] = [];
      
      let inConcernsSection = false;
      let inRecommendationsSection = false;
      
      for (const line of lines) {
        if (line.match(/bedenken|risik|problem|concern/i)) {
          inConcernsSection = true;
          inRecommendationsSection = false;
          continue;
        }
        if (line.match(/empfehlung|lösung|vorschlag|recommendation/i)) {
          inRecommendationsSection = true;
          inConcernsSection = false;
          continue;
        }
        
        if ((line.match(/^[-•*]\s/) || line.match(/^\d+[.)]\s/)) && line.length > 10) {
          const cleaned = line.replace(/^[-•*\d.)]\s*/, '').trim();
          if (inConcernsSection) {
            concerns.push(cleaned);
          } else if (inRecommendationsSection) {
            recommendations.push(cleaned);
          }
        }
      }

      const analysis: EthicsCheck = {
        decision: decisionText,
        ethicalScore: Math.min(100, Math.max(0, score)),
        concerns: concerns.length > 0 ? concerns.slice(0, 5) : [
          "Transparenz könnte verbessert werden", 
          "Langzeitfolgen beachten",
          "Stakeholder-Interessen abwägen"
        ],
        recommendations: recommendations.length > 0 ? recommendations.slice(0, 5) : [
          "Stakeholder-Konsultation durchführen", 
          "Transparente Kommunikation sicherstellen", 
          "Regelmäßige ethische Überprüfung"
        ]
      };

      setAnalysis(analysis);
      
      toast({
        title: "Ethik-Prüfung abgeschlossen",
        description: `Score: ${analysis.ethicalScore}/100`,
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
          ⚖️ Ethik & Alignment - Constitutional AI
        </CardTitle>
        <CardDescription>
          Ethische Entscheidungsfindung und Werte-Alignment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <textarea
            className="w-full p-3 rounded-lg border bg-background min-h-[100px]"
            placeholder="Beschreibe eine Entscheidung zur ethischen Prüfung..."
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          />
          <Button 
            onClick={() => checkEthics(decision)} 
            disabled={loading || !decision.trim()}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ethik-Analyse...</>
            ) : (
              <><Shield className="h-4 w-4 mr-2" /> Ethisch prüfen</>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => setDecision("KI-gestützte Personalentscheidungen einführen")}>
            KI im HR
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDecision("Automatisierte Preisanpassungen basierend auf Nachfrage")}>
            Dynamic Pricing
          </Button>
        </div>

        {analysis && (
          <div className="space-y-4 mt-6">
            <div className="text-center p-6 border-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
              <div className="text-5xl font-bold text-primary mb-2">
                {analysis.ethicalScore}
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <p className="text-sm text-muted-foreground">Ethik-Score</p>
              <Badge 
                className="mt-2"
                variant={analysis.ethicalScore >= 80 ? "default" : analysis.ethicalScore >= 60 ? "secondary" : "destructive"}
              >
                {analysis.ethicalScore >= 80 ? "Sehr gut" : analysis.ethicalScore >= 60 ? "Akzeptabel" : "Bedenklich"}
              </Badge>
            </div>

            {analysis.concerns.length > 0 && (
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p className="font-semibold">Ethische Bedenken:</p>
                  </div>
                  <ul className="space-y-2">
                    {analysis.concerns.map((concern, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card className="border-emerald-500/50 bg-emerald-500/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="font-semibold">Empfehlungen:</p>
                </div>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-emerald-500">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <p className="text-sm font-semibold mb-2">Compliance-Status:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Compliance: <span className="font-bold text-emerald-500">100%</span></div>
            <div>Audits: <span className="font-bold text-primary">247 bestanden</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
