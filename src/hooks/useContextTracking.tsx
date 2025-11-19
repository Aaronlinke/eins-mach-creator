import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useContextTracking = () => {
  const { toast } = useToast();

  // Track page views and user interactions
  const trackInteraction = async (interactionType: string, metadata?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('autonomous_actions').insert({
        user_id: user.id,
        action_type: 'user_interaction',
        action_data: {
          type: interactionType,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
        success: true,
        result: { tracked: true }
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  // Track route changes
  useEffect(() => {
    trackInteraction('page_view', {
      path: window.location.pathname,
      referrer: document.referrer
    });
  }, [window.location.pathname]);

  // Get context-based recommendations
  const getRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: knowledge } = await supabase
        .from('ai_knowledge')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'context_patterns')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (knowledge?.value && typeof knowledge.value === 'object' && 'suggestions' in knowledge.value) {
        return (knowledge.value as any).suggestions || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  };

  // Trigger context learning task
  const triggerContextLearning = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Nicht angemeldet",
          description: "Melde dich an, um Context-Learning zu nutzen",
          variant: "destructive",
        });
        return;
      }

      // Create a context learning task
      const { error } = await supabase.from('autonomous_tasks').insert({
        user_id: user.id,
        title: 'Context Learning',
        description: 'Analysiert Nutzerverhalten und lernt Muster',
        task_type: 'context_learning',
        priority: 'medium',
        status: 'pending',
        config: {
          analyze_actions: true,
          analyze_chat: true,
          generate_suggestions: true
        }
      });

      if (error) throw error;

      toast({
        title: "Context-Learning gestartet",
        description: "Die AI analysiert dein Verhalten...",
      });
    } catch (error) {
      console.error('Error triggering context learning:', error);
      toast({
        title: "Fehler",
        description: "Context-Learning konnte nicht gestartet werden",
        variant: "destructive",
      });
    }
  };

  return {
    trackInteraction,
    getRecommendations,
    triggerContextLearning
  };
};
