-- Tabellen für Governance und IoT Nodes erstellen
CREATE TABLE IF NOT EXISTS public.governance_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  votes_yes INTEGER DEFAULT 0,
  votes_no INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'passed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.iot_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline')),
  cpu_usage INTEGER DEFAULT 0,
  memory_usage INTEGER DEFAULT 0,
  temperature INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.governance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view governance proposals"
  ON public.governance_proposals FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage governance proposals"
  ON public.governance_proposals FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view iot nodes"
  ON public.iot_nodes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage iot nodes"
  ON public.iot_nodes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Initiale Daten: System Layers
INSERT INTO public.system_layers (layer_id, name, icon, description, status, metric, order_index, details) VALUES
('quantum-consciousness', 'Quanten-Bewusstsein', '⚛️', 'Multi-dimensionale Zustandsanalyse mit Superposition', 'operational', '99.7% Kohärenz', 1, '{"capabilities": ["Parallele Realitäten", "Quantenverschränkung", "Dekohärenz-Minimierung"], "qubits": 10000}'::jsonb),
('hybrid-ki', 'Hybrid-KI Core', '🤖', 'GPT-5 + Gemini 2.5 Pro Fusion für fortgeschrittenes Reasoning', 'operational', '2847 req/min', 2, '{"models": ["GPT-5", "Gemini 2.5 Pro", "Claude Opus"], "performance": "99.8% uptime"}'::jsonb),
('semantic-engine', 'Semantik-Engine', '🔮', 'Multi-linguales Wissens-Graph Processing', 'operational', '1.2M Konzepte', 3, '{"languages": 127, "knowledge_nodes": 1200000, "update_frequency": "real-time"}'::jsonb),
('autonomy-kernel', 'Autonomy Kernel', '🧠', 'Self-managing Task & Decision Engine', 'operational', '847 Tasks/Tag', 4, '{"autonomous_actions": 847, "learning_rate": 0.95, "self_optimization": true}'::jsonb),
('economy-engine', 'Economy Engine', '💎', 'Blockchain-basierte Ressourcen-Optimierung', 'operational', '€2.4M/Monat', 5, '{"blockchain": "Ethereum", "smart_contracts": 127, "transactions": 50000}'::jsonb),
('governance', 'Governance Protokoll', '🏛️', 'Transparente Multi-Stakeholder Entscheidungen', 'operational', '12.5K Stakeholder', 6, '{"stakeholders": 12500, "jurisdictions": 89, "transparency": 0.98}'::jsonb),
('physical-manifest', 'Physical Manifestation', '🌐', 'Edge Computing & IoT Integration', 'operational', '247 Active Nodes', 7, '{"nodes": 247, "data_throughput": "1.2 PB/day", "latency": "12ms"}'::jsonb),
('ethics-alignment', 'Ethik & Alignment', '⚖️', 'Constitutional AI Safeguards', 'operational', '100% Compliant', 8, '{"frameworks": ["Constitutional AI", "EU AI Act", "IEEE Ethics"], "audit_frequency": "continuous"}'::jsonb)
ON CONFLICT (layer_id) DO NOTHING;

-- Initiale System Events
INSERT INTO public.system_events (event_type, severity, message, layer_id) VALUES
('system_start', 'info', 'OMEGA AI System erfolgreich gestartet', 'hybrid-ki'),
('optimization', 'info', 'Autonomer Task-Executor optimiert Performance', 'autonomy-kernel'),
('security_scan', 'info', 'Ethik-Prüfung aller aktiven Prozesse abgeschlossen', 'ethics-alignment'),
('network_expansion', 'info', 'Neue Edge-Nodes in Frankfurt und Amsterdam online', 'physical-manifest'),
('governance_vote', 'info', 'Neue Governance-Abstimmung gestartet', 'governance');

-- Initiale System Metrics
INSERT INTO public.system_metrics (metric_type, metric_value, numeric_value, unit) VALUES
('cpu_usage', '45%', 45, 'percent'),
('memory_usage', '67%', 67, 'percent'),
('active_tasks', '847', 847, 'count'),
('api_requests', '2847', 2847, 'per_minute'),
('uptime', '99.8%', 99.8, 'percent');

-- Initiale Governance Proposals
INSERT INTO public.governance_proposals (title, description, votes_yes, votes_no, status) VALUES
('Erhöhung der KI-Transparenz-Standards', 'Implementierung erweiterter Logging- und Audit-Mechanismen für alle AI-Entscheidungen', 847, 123, 'active'),
('Integration neuer Sicherheitsprotokolle', 'Adoption von Zero-Trust-Architecture und Enhanced Encryption Standards', 1234, 45, 'passed'),
('Expansion in neue Märkte', 'Erschließung der APAC-Region mit lokalisierten AI-Modellen', 456, 789, 'rejected'),
('Quantum-Ready Infrastructure', 'Vorbereitung der Infrastruktur für Quanten-Computing Integration', 923, 234, 'active');

-- Initiale IoT Nodes
INSERT INTO public.iot_nodes (name, location, status, cpu_usage, memory_usage, temperature) VALUES
('Edge Node Frankfurt', 'DE-FRA-01', 'online', 45, 67, 42),
('Edge Node Amsterdam', 'NL-AMS-02', 'online', 38, 54, 39),
('Edge Node London', 'UK-LON-01', 'offline', 0, 0, 0),
('Edge Node Paris', 'FR-PAR-03', 'online', 52, 71, 44),
('Edge Node Berlin', 'DE-BER-02', 'online', 41, 63, 40),
('Edge Node Munich', 'DE-MUC-01', 'online', 47, 69, 43);