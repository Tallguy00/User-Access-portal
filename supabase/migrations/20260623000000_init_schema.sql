-- Identity Directory & Access Requests Database Schema Migration
-- Created: 2026-06-23

-- Ensure UUID extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------
-- 1. DEPARTMENTS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Seed initial departments
INSERT INTO public.departments (id, name, description) VALUES
  ('dep-eng', 'Engineering', 'Software engineering, DevOps, and cloud infrastructure operations'),
  ('dep-fin', 'Finance & Accounting', 'Financial planning, accounting, and payroll systems'),
  ('dep-hr', 'Human Resources', 'Talent acquisition, employee relations, and benefits'),
  ('dep-ops', 'Operations & IT', 'Internal IT infrastructure, security, and administrative services'),
  ('dep-mkt', 'Marketing & Sales', 'Growth, CRM management, and outward communications')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;


--------------------------------------------------
-- 2. SYSTEM APPLICATIONS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_applications ENABLE ROW LEVEL SECURITY;

-- Seed initial system applications
INSERT INTO public.system_applications (id, name, description, category) VALUES
  ('sys-aws', 'AWS Production environment', 'Production hosting services for SaaS apps and APIs', 'Infrastructure'),
  ('sys-pg', 'PostgreSQL Database Server', 'Main relational databases hosting customer and transaction logs', 'Database'),
  ('sys-fin', 'Quarterly Audits Sharepoint Folder', 'Confidential folder containing tax documents and spreadsheets', 'File Storage'),
  ('sys-vpn', 'Secure Corporate VPN Cluster', 'Remote access gateway for internal web and secure hosts', 'Network'),
  ('sys-slack', 'Executive Channels Email Group', 'Access to executive and sensitive communications', 'Email/Comm'),
  ('sys-sap', 'SAP ERP Server', 'Enterprise resource planning and financial bookkeeping platform', 'Application')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;


--------------------------------------------------
-- 3. PROFILES
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('User', 'Manager', 'IT Admin', 'Super Admin')) DEFAULT 'User',
  department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Deactivated')) DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notification_preferences JSONB NOT NULL DEFAULT '{"onSubmitted": true, "onUnderReview": true, "onApproved": true, "onRejected": true, "onCompleted": true}'::jsonb
);

-- Create index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


--------------------------------------------------
-- 4. PROFILE SYNCHRONIZATION TRIGGER (auth.users -> public.profiles)
--------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_full_name TEXT;
  meta_role TEXT;
  meta_dept TEXT;
  meta_mfa BOOLEAN;
BEGIN
  -- Safely extract metadata with both snake_case and camelCase fallback
  IF new.raw_user_meta_data IS NOT NULL THEN
    meta_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'fullName');
    meta_role := COALESCE(new.raw_user_meta_data->>'role', 'User');
    meta_dept := COALESCE(new.raw_user_meta_data->>'department_id', new.raw_user_meta_data->>'departmentId');
    meta_mfa := COALESCE((new.raw_user_meta_data->>'mfa_enabled')::boolean, (new.raw_user_meta_data->>'mfaEnabled')::boolean, FALSE);
  ELSE
    meta_full_name := NULL;
    meta_role := 'User';
    meta_dept := 'dep-eng';
    meta_mfa := FALSE;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, department_id, status, mfa_enabled)
  VALUES (
    new.id,
    COALESCE(meta_full_name, split_part(new.email, '@', 1)),
    new.email,
    COALESCE(meta_role, 'User'),
    COALESCE(meta_dept, 'dep-eng'),
    'Active',
    COALESCE(meta_mfa, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    role = COALESCE(EXCLUDED.role, profiles.role),
    department_id = COALESCE(EXCLUDED.department_id, profiles.department_id);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--------------------------------------------------
-- RLS POLICIES FOR DEPARTMENTS, SYSTEMS & PROFILES
--------------------------------------------------

-- Departments policies
CREATE POLICY "Allow read access to departments for all authenticated users"
ON public.departments FOR SELECT
TO authenticated
USING (TRUE);

-- System Applications policies
CREATE POLICY "Allow read access to systems for all authenticated users"
ON public.system_applications FOR SELECT
TO authenticated
USING (TRUE);

-- Helpers to inspect roles dynamically
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('IT Admin', 'Super Admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Manager'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Allow profiles read access to all authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admins full management access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


--------------------------------------------------
-- 5. ACCESS REQUESTS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_requests (
  id TEXT PRIMARY KEY DEFAULT 'req-' || gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_full_name TEXT NOT NULL,
  department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('Application Access', 'Database Access', 'Folder Access', 'Email Group Access', 'VPN Access', 'Server Access')),
  system_name TEXT NOT NULL,
  justification TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments TEXT,
  comments_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  provisioned_credentials JSONB
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON public.access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_department ON public.access_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.access_requests(status);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Access Requests Policies
CREATE POLICY "Allow select requests for owners, department managers, or admins"
ON public.access_requests FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (public.is_manager() AND (
    department_id = (SELECT department_id FROM public.profiles WHERE id = auth.uid())
    OR
    COALESCE(department_id, (SELECT department_id FROM public.profiles WHERE id = user_id)) = (SELECT department_id FROM public.profiles WHERE id = auth.uid())
  ))
  OR public.is_admin()
);

CREATE POLICY "Allow request creation for authenticated users"
ON public.access_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow request update for owners, department managers, or admins"
ON public.access_requests FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR (public.is_manager() AND (
    department_id = (SELECT department_id FROM public.profiles WHERE id = auth.uid())
    OR
    COALESCE(department_id, (SELECT department_id FROM public.profiles WHERE id = user_id)) = (SELECT department_id FROM public.profiles WHERE id = auth.uid())
  ))
  OR public.is_admin()
);

CREATE POLICY "Allow request deletion for owners of Drafts or admins"
ON public.access_requests FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id AND status = 'Draft')
  OR public.is_admin()
);


--------------------------------------------------
-- 6. APP NOTIFICATIONS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT 'nt-' || gen_random_uuid()::text,
  user_email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('submitted', 'approved', 'rejected', 'granted', 'info_requested', 'security'))
);

-- Indexing for user filter
CREATE INDEX IF NOT EXISTS idx_notifications_email ON public.notifications(user_email);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for Notifications
CREATE POLICY "Allow user to view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Allow user to modify their own notifications status"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Allow backend triggers or admins to insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (TRUE);


--------------------------------------------------
-- 7. AUDIT LOGS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT 'log-' || gen_random_uuid()::text,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  device TEXT
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Audit Logs
CREATE POLICY "Allow user to create audit logs on events"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (TRUE);

CREATE POLICY "Allow admins to view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());
