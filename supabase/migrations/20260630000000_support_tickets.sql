-- IT Support Tickets Table Definition
-- Created: 2026-06-30

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
  user_role TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Login Issue', 'Access Request', 'Account Problem', 'Technical Issue', 'Password Reset', 'Bug Report', 'Other')),
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
  status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
  description TEXT NOT NULL,
  attachment_name TEXT,
  attachment_size TEXT,
  assigned_to_id TEXT,
  assigned_to_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  activity_logs JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_email ON public.support_tickets(user_email);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Helper definitions are already available in public.is_admin() and public.is_manager()

-- Policies for Support Tickets
CREATE POLICY "Allow users to view their own tickets or admins to view all"
ON public.support_tickets FOR SELECT
TO authenticated
USING (
  user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR public.is_admin()
);

CREATE POLICY "Allow users to submit new tickets"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (TRUE);

CREATE POLICY "Allow users to update their own tickets or admins to update all"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (
  user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR public.is_admin()
)
WITH CHECK (TRUE);

CREATE POLICY "Allow admins to delete tickets"
ON public.support_tickets FOR DELETE
TO authenticated
USING (public.is_admin());
