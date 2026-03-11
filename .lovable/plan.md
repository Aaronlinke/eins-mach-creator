
# OMEGA System - Komplett-Analyse und Optimierungsplan

## Status-Ubersicht: Was funktioniert, was nicht, was verbessert werden muss

---

## FUNKTIONIERT (OK)

1. **Frontend-Routing** - Alle 5 Routen funktionieren (/, /layer/:id, /overview, /auth, /admin)
2. **Auth-System** - Login/Signup mit E-Mail funktioniert korrekt
3. **Admin-Zugriffskontrolle** - Rollenbasiert uber `user_roles` Tabelle (korrekt implementiert)
4. **Dashboard (Index)** - Zeigt System-Layer, Metriken und Brain Assistant
5. **System-Ubersicht** - Live-Event-Stream mit Realtime-Updates
6. **Layer-Detail-Seite** - Zeigt Layer-Details und Events
7. **Brain Assistant (Chat)** - Kommuniziert mit Google Gemini uber `hybrid-ai-chat`
8. **Hybrid AI Panel** - Chat mit Konversations-Speicherung in DB
9. **Web Automation** - Scraping, Link-Extraktion und Monitoring funktionieren
10. **Datenbank-Daten** - 11 System-Layers, 9 Metriken, 10 Events vorhanden
11. **Design-System** - Light/Dark Mode mit OMEGA-Branding

---

## PROBLEME (Muss behoben werden)

### 1. Stale "Running" Task blockiert Scheduler
- 1 `brain_optimization` Task steckt im Status "running" fest (alter als 1 Stunde)
- Der `brain-scheduler` uberspringt neue Tasks wenn pending/running Tasks existieren
- **Losung:** Stale running Tasks auf "failed" setzen + Scheduler-Logik verbessern mit Timeout

### 2. Stale "Pending" Context Learning Task
- 1 `context_learning` Task steckt auf "pending"
- Wird nie automatisch ausgefuhrt
- **Losung:** Bereinigen und Timeout-Logik im Scheduler einbauen

### 3. Edge Functions ohne Authentifizierung (Sicherheit)
- Alle 6 Edge Functions haben `verify_jwt = false`
- Jeder kann `autonomous-executor`, `brain-manager`, `web-automation` aufrufen
- **Losung:** Auth-Checks in jede Function einbauen (getClaims fur user-facing, Secret-Token fur Scheduler)

### 4. Web Automation SSRF-Schwachstelle
- `web-automation` akzeptiert beliebige URLs ohne Validierung
- Interne Dienste (localhost, 169.254.x.x) erreichbar
- **Losung:** URL-Validierung mit Blockierung privater IP-Bereiche

### 5. System-Events offentlich lesbar
- SELECT-Policy erlaubt jedem `true` - alle Events sichtbar
- **Losung:** Nur Admin-Zugriff erlauben

### 6. Profiles fehlende INSERT-Policy
- Neue Benutzer konnen kein Profil erstellen (der `handle_new_user` Trigger nutzt SECURITY DEFINER, umgeht RLS - funktioniert, aber direkte Inserts schlagen fehl)

### 7. SystemManagement Buttons ohne Funktion
- "Auth-Einstellungen", "Sicherheitsrichtlinien", "Performance-Tuning", "Backup" Buttons tun nichts
- "Metriken-Dashboard" zeigt nur Toast

### 8. Realtime-Subscription auf Index-Seite macht nichts
- Der Channel-Listener auf Zeile 67 hat einen leeren Callback `() => {}` - macht eigentlich kein Refetch

### 9. Context Tracking useEffect-Dependency
- `useContextTracking` hat `window.location.pathname` als useEffect-Dependency - das ist kein React-State und triggert nie Re-Renders

---

## OPTIMIERUNGEN (Doppelte Leistung)

### 1. Scheduler mit automatischer Stale-Task-Bereinigung
- Vor Task-Erstellung: Running Tasks alter als 30 Min auf "failed" setzen
- Pending Tasks alter als 1 Stunde loschen
- Verhindert permanentes Blockieren

### 2. Brain Optimization Performance verdoppeln
- Parallele Ausfuhrung: `analyze`, `build_graph`, `generate_content`, `generate_insights` gleichzeitig statt nacheinander
- Aktuell werden sie sequentiell uber `supabase.functions.invoke` aufgerufen

### 3. Index-Seite Realtime tatsachlich nutzen
- QueryClient invalidation im Realtime-Callback
- System-Layer und Metriken automatisch aktualisieren

### 4. Rate Limiting verbessern
- Aktuell in-memory (wird bei Function-Neustart zuruck gesetzt)
- Besser: DB-basiertes Rate Limiting oder mindestens konsistentere Fehlermeldungen

---

## Implementierungsplan (Reihenfolge)

### Schritt 1: Stale Tasks bereinigen und Scheduler hartten
- SQL: Stale running Tasks auf "failed" setzen
- `brain-scheduler` erweitern: Tasks alter als 30 Min automatisch bereinigen
- Timeout-Logik direkt im Scheduler

### Schritt 2: Edge Functions absichern
- Auth-Checks in `autonomous-executor`, `brain-manager`, `web-automation`
- Interner Scheduler-Aufruf uber Service-Key validieren
- SSRF-Schutz in `web-automation`

### Schritt 3: RLS-Policies korrigieren
- `system_events` SELECT nur fur Admins
- `profiles` INSERT-Policy hinzufugen
- Weitere offentliche SELECT-Policies prufen

### Schritt 4: Performance-Verdopplung
- `autonomous-executor` `executeBrainOptimization`: Parallele Ausfuhrung mit `Promise.all`
- Index-Seite: Realtime-Callback mit Query-Invalidierung
- `useContextTracking`: Korrekte Dependency fur Route-Tracking

### Schritt 5: Nicht-funktionale Buttons reparieren
- SystemManagement Buttons mit echten Aktionen oder entfernen
- Toast-only Buttons durch funktionale Dialoge ersetzen

### Technische Details

**Stale Task Bereinigung (SQL):**
```text
UPDATE autonomous_tasks
SET status = 'failed', error_log = 'Timeout - automatisch bereinigt'
WHERE status = 'running'
AND last_run_at < NOW() - INTERVAL '30 minutes';

DELETE FROM autonomous_tasks
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '1 hour';
```

**brain-scheduler Erweiterung:**
- Vor der Prufung auf existierende Tasks: Stale Tasks bereinigen
- Timeout-Logik: Running > 30min = failed, Pending > 1h = delete

**Parallele Brain-Optimierung:**
```text
// Statt sequentiell:
const results = await Promise.allSettled([
  config.analyze ? supabase.functions.invoke('brain-manager', { body: { action: 'analyze_and_optimize' } }) : null,
  config.build_graph ? supabase.functions.invoke('brain-manager', { body: { action: 'build_knowledge_graph' } }) : null,
  config.generate_content ? supabase.functions.invoke('brain-manager', { body: { action: 'generate_content' } }) : null,
  config.generate_insights ? supabase.functions.invoke('brain-manager', { body: { action: 'generate_insights' } }) : null,
].filter(Boolean));
```

**Realtime-Fix (Index.tsx):**
```text
// Im Callback:
queryClient.invalidateQueries({ queryKey: ["system-layers"] });
```

Dieser Plan behebt alle Blockaden, schliesst Sicherheitslucken und verdoppelt die Performance des autonomen Systems.
