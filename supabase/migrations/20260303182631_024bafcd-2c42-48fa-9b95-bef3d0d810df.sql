-- Fix system_events: restrict SELECT to admins only
DROP POLICY IF EXISTS "Public read access for system_events" ON system_events;
CREATE POLICY "Admins can read system_events" ON system_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add INSERT policy for profiles
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);