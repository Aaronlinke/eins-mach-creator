import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Copy, Check, Trash2, Plus } from "lucide-react";

export default function HybridAIPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadConversation();
  }, []);

  const loadConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    // Get or create conversation
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    let currentConvId: string;

    if (conversations && conversations.length > 0) {
      currentConvId = conversations[0].id;
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title: 'Hybrid AI Chat' })
        .select()
        .single();
      currentConvId = newConv!.id;
    }

    setConversationId(currentConvId);

    // Load messages
    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', currentConvId)
      .order('created_at', { ascending: true });

    if (chatMessages) {
      setMessages(chatMessages.map(msg => ({ role: msg.role, content: msg.content })));
    }
  };

  const saveMessage = async (role: string, content: string) => {
    if (!userId || !conversationId) return;

    await supabase.from('chat_messages').insert({
      user_id: userId,
      conversation_id: conversationId,
      role,
      content
    });

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  };

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

  const clearConversation = async () => {
    if (!conversationId) return;

    await supabase
      .from('chat_messages')
      .delete()
      .eq('conversation_id', conversationId);

    setMessages([]);
    toast({
      title: "Gelöscht",
      description: "Konversation wurde gelöscht",
    });
  };

  const newConversation = async () => {
    if (!userId) return;

    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: 'Neue Konversation' })
      .select()
      .single();

    setConversationId(newConv!.id);
    setMessages([]);
    
    toast({
      title: "Neue Konversation",
      description: "Neue Konversation gestartet",
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || !userId || !conversationId) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Save user message
    await saveMessage("user", userMessage.content);

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
      
      // Save assistant message
      await saveMessage("assistant", assistantMessage.content);
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🧠 Hybrid AI - Neural-Symbolic Fusion
            </CardTitle>
            <CardDescription>
              Combining deep learning with symbolic reasoning for explainable AI
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={newConversation}>
              <Plus className="h-4 w-4 mr-1" />
              Neu
            </Button>
            <Button variant="outline" size="sm" onClick={clearConversation}>
              <Trash2 className="h-4 w-4 mr-1" />
              Löschen
            </Button>
          </div>
        </div>
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
