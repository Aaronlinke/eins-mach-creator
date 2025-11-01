-- System Layers Tabelle für dynamische Inhalte
CREATE TABLE public.system_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text NOT NULL,
  status text NOT NULL CHECK (status IN ('operational', 'warning', 'critical')),
  metric text NOT NULL,
  description text NOT NULL,
  details jsonb,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- System Metrics für Echtzeit-Daten
CREATE TABLE public.system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  metric_value text NOT NULL,
  numeric_value numeric,
  unit text,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb
);

-- System Events/Logs
CREATE TABLE public.system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message text NOT NULL,
  layer_id text REFERENCES public.system_layers(layer_id),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- API Connections für externe Integrationen
CREATE TABLE public.api_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_name text UNIQUE NOT NULL,
  api_type text NOT NULL,
  endpoint_url text,
  is_active boolean DEFAULT true,
  last_sync timestamptz,
  config jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies (öffentlich lesbar für Dashboard)
ALTER TABLE public.system_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for system_layers" ON public.system_layers FOR SELECT USING (true);
CREATE POLICY "Public read access for system_metrics" ON public.system_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access for system_events" ON public.system_events FOR SELECT USING (true);
CREATE POLICY "Public read access for api_connections" ON public.api_connections FOR SELECT USING (true);

-- Realtime aktivieren
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_layers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_events;

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_layers_updated_at
BEFORE UPDATE ON public.system_layers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Initial Data für die 8 System Layers
INSERT INTO public.system_layers (layer_id, name, icon, status, metric, description, order_index, details) VALUES
('quantum-consciousness', 'Quantum Consciousness', '⚛️', 'operational', '99.97% Coherence', 'Quantum-enhanced decision making engine utilizing superposition states for parallel scenario analysis', 1, '{"technology": "Quantum Computing", "capabilities": ["Multi-dimensional analysis", "Parallel processing", "Quantum entanglement"], "metrics": {"coherence": 99.97, "qubits": 1024}}'),
('neural-symbolic', 'Neural-Symbolic Fusion', '🧠', 'operational', '847M Parameters', 'Hybrid AI architecture combining neural networks with symbolic reasoning for explainable intelligence', 2, '{"technology": "Hybrid AI", "capabilities": ["Deep learning", "Symbolic reasoning", "Explainable AI"], "metrics": {"parameters": 847000000, "accuracy": 98.5}}'),
('semantic-engine', 'Semantic Engine', '🔮', 'operational', '2.3M Concepts', 'Advanced knowledge graph processing with multi-lingual understanding and context awareness', 3, '{"technology": "Knowledge Graph", "capabilities": ["Natural language understanding", "Context awareness", "Multi-lingual support"], "metrics": {"concepts": 2300000, "languages": 127}}'),
('autonomy-kernel', 'Autonomy Kernel', '🎯', 'operational', '156 Active Agents', 'Self-organizing agent swarm with distributed decision-making and adaptive learning capabilities', 4, '{"technology": "Multi-Agent System", "capabilities": ["Autonomous operation", "Swarm intelligence", "Adaptive learning"], "metrics": {"agents": 156, "tasks_per_hour": 45000}}'),
('ethics-central', 'Ethics & Alignment', '⚖️', 'operational', '100% Compliance', 'Constitutional AI framework ensuring ethical decision-making and value alignment', 5, '{"technology": "Constitutional AI", "capabilities": ["Ethical reasoning", "Value alignment", "Transparency"], "metrics": {"compliance": 100, "audits_passed": 247}}'),
('economy-engine', 'Economy Engine', '💎', 'operational', '$47.2B Managed', 'Integrated economic modeling and resource optimization across global markets', 6, '{"technology": "Economic Modeling", "capabilities": ["Market analysis", "Resource optimization", "Predictive modeling"], "metrics": {"assets_managed": 47200000000, "roi": 34.7}}'),
('governance', 'Governance Protocol', '🏛️', 'operational', '89 Jurisdictions', 'Multi-stakeholder governance framework with transparent decision-making processes', 7, '{"technology": "Governance Framework", "capabilities": ["Stakeholder management", "Transparent voting", "Regulatory compliance"], "metrics": {"jurisdictions": 89, "stakeholders": 12500}}'),
('physical', 'Physical Manifestation', '🌐', 'operational', '247 Nodes Online', 'Distributed infrastructure network with IoT integration and edge computing capabilities', 8, '{"technology": "Edge Computing", "capabilities": ["IoT integration", "Distributed processing", "Real-time control"], "metrics": {"nodes": 247, "data_throughput": "1.2PB/day"}}');

-- Initial Metrics
INSERT INTO public.system_metrics (metric_type, metric_value, numeric_value, unit) VALUES
('total_systems', '8 Systems', 8, 'systems'),
('ai_nodes', '2,847 Nodes', 2847, 'nodes'),
('distributed_agents', '156 Agents', 156, 'agents'),
('processing_capacity', '847M Param/s', 847000000, 'parameters_per_second');