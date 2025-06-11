
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Drop existing audit policies
DROP POLICY IF EXISTS "Users can view their own audits" ON public.audits;
DROP POLICY IF EXISTS "Managers can view all audits" ON public.audits;
DROP POLICY IF EXISTS "Users can insert their own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can update their own audits" ON public.audits;
DROP POLICY IF EXISTS "Managers can update any audit" ON public.audits;
DROP POLICY IF EXISTS "Users can delete their own audits" ON public.audits;

-- Drop existing contacts policies
DROP POLICY IF EXISTS "Users can view contacts of their audits" ON public.contacts;
DROP POLICY IF EXISTS "Users can manage contacts of their audits" ON public.contacts;

-- Drop existing status_log policies
DROP POLICY IF EXISTS "Users can view status logs of their audits" ON public.status_log;
DROP POLICY IF EXISTS "Users can manage status logs of their audits" ON public.status_log;

-- Update profiles table to link with auth.users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing profiles to link with auth.users based on email matching
UPDATE public.profiles 
SET user_id = auth_users.id
FROM auth.users auth_users
WHERE public.profiles.email = auth_users.email
AND public.profiles.user_id IS NULL;

-- Create a trigger function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'בודק'),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run the function when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update audits table to use auth user_id instead of email
ALTER TABLE public.audits 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Migrate existing audit owner_id (email) to user_id
UPDATE public.audits 
SET user_id = auth_users.id
FROM auth.users auth_users
WHERE public.audits.owner_id = auth_users.email
AND public.audits.user_id IS NULL;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE profiles.user_id = $1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create proper RLS policies for audits
CREATE POLICY "auth_users_can_view_own_audits" ON public.audits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "auth_managers_can_view_all_audits" ON public.audits
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('מנהלת', 'מנהל מערכת'));

CREATE POLICY "auth_users_can_insert_own_audits" ON public.audits
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "auth_users_can_update_own_audits" ON public.audits
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "auth_managers_can_update_any_audit" ON public.audits
  FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('מנהלת', 'מנהל מערכת'));

CREATE POLICY "auth_users_can_delete_own_audits" ON public.audits
  FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for contacts
CREATE POLICY "auth_users_can_view_contacts_of_audits" ON public.contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = contacts.audit_id 
      AND (audits.user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('מנהלת', 'מנהל מערכת'))
    )
  );

CREATE POLICY "auth_users_can_manage_contacts_of_audits" ON public.contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = contacts.audit_id 
      AND (audits.user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('מנהלת', 'מנהל מערכת'))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = contacts.audit_id 
      AND (audits.user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('מנהלת', 'מנהל מערכת'))
    )
  );

-- Create RLS policies for status_log
CREATE POLICY "auth_users_can_view_status_logs_of_audits" ON public.status_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = status_log.audit_id 
      AND (audits.user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('מנהלת', 'מנהל מערכת'))
    )
  );

CREATE POLICY "auth_users_can_manage_status_logs_of_audits" ON public.status_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = status_log.audit_id 
      AND (audits.user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('מנהלת', 'מנהל מערכת'))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE audits.id = status_log.audit_id 
      AND (audits.user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('מנהלת', 'מנהל מערכת'))
    )
  );

-- Create RLS policies for profiles
CREATE POLICY "auth_users_can_view_own_profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "auth_admins_can_view_all_profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'מנהל מערכת');

CREATE POLICY "auth_admins_can_manage_profiles" ON public.profiles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'מנהל מערכת')
  WITH CHECK (public.get_user_role(auth.uid()) = 'מנהל מערכת');

CREATE POLICY "auth_users_can_update_own_profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());
