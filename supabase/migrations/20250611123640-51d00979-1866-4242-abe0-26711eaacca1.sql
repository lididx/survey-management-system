
-- Drop existing policies that rely on Supabase auth
DROP POLICY IF EXISTS "Users can insert their own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can view their own audits" ON public.audits;
DROP POLICY IF EXISTS "Managers can view all audits" ON public.audits;
DROP POLICY IF EXISTS "Users can update their own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can delete their own audits" ON public.audits;
DROP POLICY IF EXISTS "Managers can update any audit" ON public.audits;

-- Create new policies that work without Supabase auth
-- Allow all authenticated operations since we're handling permissions in the app layer
CREATE POLICY "Allow all operations on audits" ON public.audits
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Drop existing policies for contacts that rely on Supabase auth
DROP POLICY IF EXISTS "view_contacts_of_visible_audits" ON public.contacts;
DROP POLICY IF EXISTS "insert_contacts_for_own_audits" ON public.contacts;
DROP POLICY IF EXISTS "update_contacts_for_own_audits" ON public.contacts;
DROP POLICY IF EXISTS "delete_contacts_for_own_audits" ON public.contacts;
DROP POLICY IF EXISTS "managers_update_any_contacts" ON public.contacts;

-- Create new policy for contacts
CREATE POLICY "Allow all operations on contacts" ON public.contacts
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Drop existing policies for status_log that rely on Supabase auth
DROP POLICY IF EXISTS "view_status_logs_of_visible_audits" ON public.status_log;
DROP POLICY IF EXISTS "insert_status_logs_for_own_audits" ON public.status_log;
DROP POLICY IF EXISTS "managers_insert_status_logs_for_any_audit" ON public.status_log;

-- Create new policy for status_log
CREATE POLICY "Allow all operations on status_log" ON public.status_log
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Keep RLS enabled but with permissive policies
-- This maintains security structure while allowing app-level permission handling
