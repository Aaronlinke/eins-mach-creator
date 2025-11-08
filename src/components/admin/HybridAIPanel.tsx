import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Copy, Check } from "lucide-react";

export default function HybridAIPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast({
        title: "Kopiert!",
        description: "Text wurde in die Zwischenablage kopiert",
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kopieren fehlgeschlagen",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('hybrid-ai-chat', {
        body: { messages: updatedMessages }
      });

      if (error) throw error;

      const assistantMessage = {
        role: "assistant",
        content: data.choices[0].message.content
      };

      setMessages([...updatedMessages, assistantMessage]);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Fehler",
        description: error.message || "KI-Antwort fehlgeschlagen",
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
          🧠 Hybrid AI - Neural-Symbolic Fusion
        </CardTitle>
        <CardDescription>
          Combining deep learning with symbolic reasoning for explainable AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 h-[400px] overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center">
              Starten Sie eine Konversation mit der Hybrid KI...
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg relative group ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-12"
                    : "bg-muted mr-12"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1">
                      {msg.role === "user" ? "Sie" : "KI"}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(msg.content, idx)}
                  >
                    {copiedIndex === idx ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              KI denkt nach...
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Fragen Sie die Hybrid KI alles..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={3}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Erkläre Quantencomputing")}
          >
            Quantencomputing
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Analysiere Markttrends")}
          >
            Marktanalyse
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Optimiere Ressourcenzuweisung")}
          >
            Optimization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
