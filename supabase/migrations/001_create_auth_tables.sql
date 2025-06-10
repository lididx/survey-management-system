
-- Create users table with encrypted passwords
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('בודק', 'מנהלת', 'מנהל מערכת')),
  encrypted_password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create audit_log table for tracking user actions
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

-- RLS Policies for audit_log table
CREATE POLICY "Admins can view all audit logs" ON audit_log
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true
  ));

CREATE POLICY "Users can view their own audit logs" ON audit_log
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "All authenticated users can insert audit logs" ON audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
