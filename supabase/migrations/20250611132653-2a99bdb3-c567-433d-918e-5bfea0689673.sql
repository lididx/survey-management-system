
-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow all operations on audits" ON public.audits;
DROP POLICY IF EXISTS "Allow all operations on contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow all operations on status_log" ON public.status_log;

-- Create proper RLS policies for audits
-- Policy 1: Users can view their own audits
CREATE POLICY "users_can_view_own_audits" ON public.audits
  FOR SELECT 
  USING (user_id = auth.uid());

-- Policy 2: Managers can view all audits  
CREATE POLICY "managers_can_view_all_audits" ON public.audits
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('מנהלת', 'מנהל מערכת')
    )
  );

-- Policy 3: Users can insert their own audits
CREATE POLICY "users_can_insert_own_audits" ON public.audits
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can update their own audits
CREATE POLICY "users_can_update_own_audits" ON public.audits
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Policy 5: Managers can update any audit
CREATE POLICY "managers_can_update_any_audit" ON public.audits
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('מנהלת', 'מנהל מערכת')
    )
  );

-- Policy 6: Users can delete their own audits
CREATE POLICY "users_can_delete_own_audits" ON public.audits
  FOR DELETE 
  USING (user_id = auth.uid());

-- Create proper RLS policies for contacts
CREATE POLICY "users_can_view_contacts_of_own_audits" ON public.contacts
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = contacts.audit_id 
      AND (
        audits.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.user_id = auth.uid() 
          AND profiles.role IN ('מנהלת', 'מנהל מערכת')
        )
      )
    )
  );

CREATE POLICY "users_can_manage_contacts_of_own_audits" ON public.contacts
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = contacts.audit_id 
      AND (
        audits.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.user_id = auth.uid() 
          AND profiles.role IN ('מנהלת', 'מנהל מערכת')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = contacts.audit_id 
      AND (
        audits.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.user_id = auth.uid() 
          AND profiles.role IN ('מנהלת', 'מנהל מערכת')
        )
      )
    )
  );

-- Create proper RLS policies for status_log
CREATE POLICY "users_can_view_status_log_of_own_audits" ON public.status_log
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = status_log.audit_id 
      AND (
        audits.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.user_id = auth.uid() 
          AND profiles.role IN ('מנהלת', 'מנהל מערכת')
        )
      )
    )
  );

CREATE POLICY "users_can_manage_status_log_of_own_audits" ON public.status_log
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = status_log.audit_id 
      AND (
        audits.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.user_id = auth.uid() 
          AND profiles.role IN ('מנהלת', 'מנהל מערכת')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = status_log.audit_id 
      AND (
        audits.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.user_id = auth.uid() 
          AND profiles.role IN ('מנהלת', 'מנהל מערכת')
        )
      )
    )
  );
