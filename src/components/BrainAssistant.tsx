import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Send, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const BrainAssistant = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin der Brain Assistant. Ich kann dir Fragen zu unserem Wissenssystem beantworten und dir bei Aufgaben helfen. Was möchtest du wissen?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('hybrid-ai-chat', {
        body: { 
          messages: messages.concat([{ role: 'user', content: userMessage }])
        }
      });

      if (error) throw error;

      const assistantMessage = data?.choices?.[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Nachricht konnte nicht gesendet werden',
        variant: 'destructive',
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Brain Assistant</h3>
              <p className="text-sm text-muted-foreground">AI-gestützter Wissens-Assistent</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Online
          </Badge>
        </div>

        {/* Messages */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-4 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Stelle eine Frage..."
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('Was kannst du für mich tun?')}
            disabled={loading}
          >
            Was kannst du?
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('Zeig mir die neuesten Insights')}
            disabled={loading}
          >
            Neueste Insights
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('Welche Features gibt es?')}
            disabled={loading}
          >
            Features
          </Button>
        </div>
      </div>
    </Card>
  );
};
