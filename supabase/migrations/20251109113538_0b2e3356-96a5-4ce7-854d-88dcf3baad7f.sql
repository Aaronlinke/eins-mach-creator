-- Autonome Tasks Tabelle
CREATE TABLE IF NOT EXISTS public.autonomous_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL, -- 'web_monitor', 'data_analysis', 'scheduled_action', 'condition_trigger'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  config JSONB, -- Task-spezifische Konfiguration
  schedule_cron TEXT, -- Cron expression für wiederkehrende Tasks
  trigger_conditions JSONB, -- Bedingungen für automatische Ausführung
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  result JSONB, -- Ergebnis der letzten Ausführung
  error_log TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.autonomous_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own autonomous tasks"
ON public.autonomous_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own autonomous tasks"
ON public.autonomous_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own autonomous tasks"
ON public.autonomous_tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own autonomous tasks"
ON public.autonomous_tasks FOR DELETE
USING (auth.uid() = user_id);

-- AI Learning / Memory Tabelle
CREATE TABLE IF NOT EXISTS public.ai_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL, -- 'user_preference', 'pattern', 'insight', 'learned_behavior'
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.5, -- 0.0 - 1.0
  source TEXT, -- Woher kommt das Wissen
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI knowledge"
ON public.ai_knowledge FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create AI knowledge"
ON public.ai_knowledge FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update AI knowledge"
ON public.ai_knowledge FOR UPDATE
USING (auth.uid() = user_id);

-- Autonome Aktionen Log
CREATE TABLE IF NOT EXISTS public.autonomous_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.autonomous_tasks(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_data JSONB,
  success BOOLEAN NOT NULL,
  result JSONB,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.autonomous_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own autonomous actions"
ON public.autonomous_actions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can log autonomous actions"
ON public.autonomous_actions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_autonomous_tasks_updated_at
BEFORE UPDATE ON public.autonomous_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_knowledge_updated_at
BEFORE UPDATE ON public.ai_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();