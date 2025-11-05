import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, DollarSign } from "lucide-react";

interface EconomicForecast {
  investment: number;
  projectedROI: number;
  timeframe: string;
  riskLevel: string;
  recommendation: string;
}

export default function EconomyEnginePanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [investment, setInvestment] = useState("");
  const [sector, setSector] = useState("");
  const [forecast, setForecast] = useState<EconomicForecast | null>(null);

  const analyzeForecast = async () => {
    if (!investment || !sector) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('hybrid-ai-chat', {
        body: { 
          messages: [{
            role: "user",
            content: `Als Economic Modeling Engine: Analysiere eine Investition von ${investment}€ im Sektor "${sector}". Gib ROI-Prognose, Zeitrahmen, Risiko und Empfehlung.`
          }]
        }
      });

      if (error) throw error;

      const response = data.choices[0].message.content;
      
      // Extrahiere ROI aus der Antwort
      let roi = 25; // Default
      const roiMatch = response.match(/roi[:\s]+(\d+(?:\.\d+)?)\s*%|(\d+(?:\.\d+)?)\s*%\s+roi/i);
      if (roiMatch) {
        roi = parseFloat(roiMatch[1] || roiMatch[2]);
      }

      // Extrahiere Zeitrahmen
      let timeframe = "12-24 Monate";
      const timeMatch = response.match(/(\d+(?:-\d+)?)\s+(monat|jahr|month|year)/i);
      if (timeMatch) {
        timeframe = timeMatch[0];
      }

      // Extrahiere Risikolevel
      let riskLevel = "Mittel";
      if (response.match(/hoch|high|erhöht/i)) riskLevel = "Hoch";
      else if (response.match(/niedrig|low|gering/i)) riskLevel = "Niedrig";

      const forecast: EconomicForecast = {
        investment: parseFloat(investment),
        projectedROI: roi,
        timeframe: timeframe,
        riskLevel: riskLevel,
        recommendation: response
      };

      setForecast(forecast);
      
      toast({
        title: "Wirtschaftsprognose erstellt",
        description: `Prognostizierter ROI: ${forecast.projectedROI}%`,
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
          💎 Economy Engine - Wirtschaftsmodellierung
        </CardTitle>
        <CardDescription>
          Integrierte Marktanalyse und Ressourcen-Optimierung
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Investition (€)</label>
            <Input
              type="number"
              placeholder="100000"
              value={investment}
              onChange={(e) => setInvestment(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Sektor</label>
            <Input
              placeholder="z.B. Tech, Energie"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={analyzeForecast} 
          disabled={loading || !investment || !sector}
          className="w-full"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analysiere Märkte...</>
          ) : (
            <><TrendingUp className="h-4 w-4 mr-2" /> Wirtschaftsprognose erstellen</>
          )}
        </Button>

        {forecast && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-emerald-500/10 border-emerald-500/30">
                <CardContent className="pt-4 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <div className="text-3xl font-bold text-emerald-500">+{forecast.projectedROI}%</div>
                  <p className="text-sm text-muted-foreground mt-1">Prognostizierter ROI</p>
                </CardContent>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="pt-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-xl font-bold text-blue-500">{forecast.timeframe}</div>
                  <p className="text-sm text-muted-foreground mt-1">Zeitrahmen</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Investitionssumme</p>
                    <p className="text-lg font-bold">{forecast.investment.toLocaleString('de-DE')} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Risikolevel</p>
                    <p className="text-lg font-bold">{forecast.riskLevel}</p>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold mb-2">Empfehlung:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {forecast.recommendation}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <p className="text-sm font-semibold mb-2">Engine-Status:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Verwaltetes Kapital: <span className="font-bold text-primary">$47.2B</span></div>
            <div>Durchschn. ROI: <span className="font-bold text-emerald-500">+34.7%</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
