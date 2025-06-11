
-- יצירת טבלת פרופילי משתמשים
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('בודק', 'מנהלת', 'מנהל מערכת')),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת סקרים
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  received_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  planned_meeting_date TIMESTAMP WITH TIME ZONE,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  current_status TEXT NOT NULL DEFAULT 'התקבל',
  owner_id TEXT NOT NULL, -- מתחבר לemail של המשתמש
  owner_name TEXT NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת אנשי קשר
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  gender TEXT DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת לוג סטטוסים
CREATE TABLE IF NOT EXISTS public.status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  old_status TEXT,
  new_status TEXT NOT NULL,
  old_date TIMESTAMP WITH TIME ZONE,
  new_date TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  modified_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הוספת אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_audits_owner_id ON public.audits(owner_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON public.audits(current_status);
CREATE INDEX IF NOT EXISTS idx_audits_archived ON public.audits(is_archived);
CREATE INDEX IF NOT EXISTS idx_contacts_audit_id ON public.contacts(audit_id);
CREATE INDEX IF NOT EXISTS idx_status_log_audit_id ON public.status_log(audit_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- הפעלת Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_log ENABLE ROW LEVEL SECURITY;

-- יצירת מדיניות RLS לפרופילים
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- יצירת מדיניות RLS לסקרים
CREATE POLICY "Auditors can view their own audits, managers can view all" ON public.audits
  FOR SELECT USING (
    owner_id = auth.jwt() ->> 'email' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE email = auth.jwt() ->> 'email' 
      AND (role = 'מנהלת' OR role = 'מנהל מערכת')
    )
  );

CREATE POLICY "Authenticated users can insert audits" ON public.audits
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update audits they own or managers can update all" ON public.audits
  FOR UPDATE USING (
    owner_id = auth.jwt() ->> 'email' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE email = auth.jwt() ->> 'email' 
      AND (role = 'מנהלת' OR role = 'מנהל מערכת')
    )
  );

CREATE POLICY "Users can delete audits they own or admins can delete all" ON public.audits
  FOR DELETE USING (
    owner_id = auth.jwt() ->> 'email' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE email = auth.jwt() ->> 'email' 
      AND (role = 'מנהל מערכת')
    )
  );

-- יצירת מדיניות RLS לאנשי קשר
CREATE POLICY "Users can view contacts for audits they have access to" ON public.contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE id = audit_id AND (
        owner_id = auth.jwt() ->> 'email' OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE email = auth.jwt() ->> 'email' 
          AND (role = 'מנהלת' OR role = 'מנהל מערכת')
        )
      )
    )
  );

CREATE POLICY "Users can insert contacts for audits they own" ON public.contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE id = audit_id AND owner_id = auth.jwt() ->> 'email'
    )
  );

-- יצירת מדיניות RLS ללוג סטטוסים
CREATE POLICY "Users can view status log for audits they have access to" ON public.status_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE id = audit_id AND (
        owner_id = auth.jwt() ->> 'email' OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE email = auth.jwt() ->> 'email' 
          AND (role = 'מנהלת' OR role = 'מנהל מערכת')
        )
      )
    )
  );

CREATE POLICY "Users can insert status log for audits they have access to" ON public.status_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits 
      WHERE id = audit_id AND (
        owner_id = auth.jwt() ->> 'email' OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE email = auth.jwt() ->> 'email' 
          AND (role = 'מנהלת' OR role = 'מנהל מערכת')
        )
      )
    )
  );

-- הוספת משתמשי ברירת מחדל
INSERT INTO public.profiles (email, name, role, is_admin) VALUES
  ('lidorn@citadel.co.il', 'לידור', 'בודק', false),
  ('moran@citadel.co.il', 'מורן', 'בודק', false),
  ('chen@citadel.co.il', 'חן', 'מנהלת', true),
  ('Citadministrator@system.co.il', 'מנהל מערכת', 'מנהל מערכת', true)
ON CONFLICT (email) DO NOTHING;
