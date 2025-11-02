import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send } from "lucide-react";

export default function HybridAIPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
        title: "Error",
        description: error.message || "Failed to get AI response",
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
              Start a conversation with the Hybrid AI...
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-12"
                    : "bg-muted mr-12"
                }`}
              >
                <p className="text-sm font-semibold mb-1">
                  {msg.role === "user" ? "You" : "AI"}
                </p>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI is thinking...
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Ask the Hybrid AI anything..."
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
            onClick={() => setInput("Explain quantum computing")}
          >
            Quantum Computing
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Analyze market trends")}
          >
            Market Analysis
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Optimize resource allocation")}
          >
            Optimization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
