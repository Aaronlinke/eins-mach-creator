

# Komplett-Reparatur und Optimierung aller Funktionen

## Kritisches Problem gefunden

Die Edge Function Logs zeigen: **brain-scheduler bekommt 401 Unauthorized** beim Aufruf von autonomous-executor. Die bei der letzten Implementierung eingebauten Auth-Checks haben **zwei kritische Bugs**:

1. **`isInternalCall()` ist kaputt**: Prüft `authHeader?.includes('service_role')` - aber das JWT-Token enthält nicht den String "service_role". Der Service-Role-Key ist ein JWT mit dem Claim `role: "service_role"`, nicht ein Klartext-String.

2. **`getClaims()` existiert nicht**: Alle Edge Functions nutzen `userSupabase.auth.getClaims(token)` - diese Methode gibt es in supabase-js v2 nicht. Die korrekte Methode ist `supabase.auth.getUser(token)`.

**Ergebnis**: Alle 6 Edge Functions sind derzeit kaputt - weder interne noch externe Aufrufe funktionieren.

---

## Betroffene Functions und Fixes

### 1. autonomous-executor (kritisch)
- `isInternalCall`: Token gegen bekannten Service-Role-Key vergleichen
- `getClaims` → `auth.getUser()` mit dem Bearer-Token
- Neuer pending Task (62062d54) steckt fest weil Executor 401 zurückgibt

### 2. brain-manager
- Gleicher `isInternalCall`-Bug
- Gleicher `getClaims`-Bug

### 3. hybrid-ai-chat
- `getClaims`-Bug → User-Auth komplett kaputt
- Brain Assistant auf Index-Seite funktioniert nicht

### 4. web-automation
- `getClaims`-Bug → Auth kaputt

### 5. autonomy-agent
- `getClaims`-Bug → Auth kaputt

### 6. brain-scheduler
- Kein eigener Bug, aber Aufruf von autonomous-executor schlägt fehl

---

## Implementierungsplan

### Fix 1: Auth-Helper-Pattern für alle Functions

Korrekter interner Aufruf-Check:
```text
function isInternalCall(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
}
```

Korrekte User-Auth:
```text
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) return 401;
```

### Fix 2: Alle 5 Functions aktualisieren
- **autonomous-executor**: Fix `isInternalCall` + ersetze `getClaims` mit `getUser`
- **brain-manager**: Fix `isInternalCall` + ersetze `getClaims` mit `getUser`
- **hybrid-ai-chat**: Ersetze `getClaims` mit `getUser`
- **web-automation**: Ersetze `getClaims` mit `getUser`
- **autonomy-agent**: Ersetze `getClaims` mit `getUser`

### Fix 3: Stale pending Task bereinigen
- Task 62062d54 auf "failed" setzen (da Executor kaputt war)

### Fix 4: BrainAssistant braucht Auth-Check
- Aktuell sendet der BrainAssistant auf der Index-Seite Nachrichten ohne eingeloggt zu sein
- Prüfung einbauen: wenn nicht eingeloggt, Hinweis zeigen statt Fehler

---

## Zusammenfassung der Änderungen

| Datei | Änderung |
|-------|----------|
| `supabase/functions/autonomous-executor/index.ts` | Fix isInternalCall + getClaims → getUser |
| `supabase/functions/brain-manager/index.ts` | Fix isInternalCall + getClaims → getUser |
| `supabase/functions/hybrid-ai-chat/index.ts` | getClaims → getUser |
| `supabase/functions/web-automation/index.ts` | getClaims → getUser |
| `supabase/functions/autonomy-agent/index.ts` | getClaims → getUser |
| `src/components/BrainAssistant.tsx` | Auth-Check vor Senden |
| DB: autonomous_tasks | Stale Task bereinigen |

