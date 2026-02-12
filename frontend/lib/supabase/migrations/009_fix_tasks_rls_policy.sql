-- Migration: Ensure tasks table is writable from client app roles
-- Symptom this fixes:
--   "new row violates row-level security policy for table \"tasks\""
--
-- The TODO app uses browser-side Supabase clients, so tasks must be readable/writable
-- by anon/authenticated roles in this household trust model.

-- Enable RLS and add an explicit allow-all policy for app roles.
-- (Equivalent behavior to disabled RLS, but explicit and resilient if RLS gets re-enabled.)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all tasks operations" ON tasks;
CREATE POLICY "Allow all tasks operations" ON tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT ALL ON tasks TO anon;
GRANT ALL ON tasks TO authenticated;
