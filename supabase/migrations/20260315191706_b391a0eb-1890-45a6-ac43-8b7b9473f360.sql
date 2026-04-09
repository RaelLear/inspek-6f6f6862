
-- Emergency contacts spreadsheet uploads (expires after 7 days)
CREATE TABLE public.emergency_spreadsheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  file_name text NOT NULL DEFAULT 'contatos.xlsx',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

-- Emergency contact records linked to a spreadsheet
CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spreadsheet_id uuid NOT NULL REFERENCES public.emergency_spreadsheets(id) ON DELETE CASCADE,
  user_id uuid DEFAULT auth.uid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  role text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT '',
  contact1_phone text,
  contact1_name text,
  contact2_phone text,
  contact2_name text,
  inspected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.emergency_spreadsheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Spreadsheets policies
CREATE POLICY "Access own spreadsheets" ON public.emergency_spreadsheets
  FOR SELECT TO authenticated
  USING (((team_id IS NULL) AND (user_id = auth.uid())) OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id)));

CREATE POLICY "Insert own spreadsheets" ON public.emergency_spreadsheets
  FOR INSERT TO authenticated
  WITH CHECK (((team_id IS NULL) AND (user_id = auth.uid())) OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id)));

CREATE POLICY "Delete own spreadsheets" ON public.emergency_spreadsheets
  FOR DELETE TO authenticated
  USING (((team_id IS NULL) AND (user_id = auth.uid())) OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id)));

CREATE POLICY "Update own spreadsheets" ON public.emergency_spreadsheets
  FOR UPDATE TO authenticated
  USING (((team_id IS NULL) AND (user_id = auth.uid())) OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id)));

-- Contacts policies
CREATE POLICY "Access own contacts" ON public.emergency_contacts
  FOR SELECT TO authenticated
  USING (((team_id IS NULL) AND (user_id = auth.uid())) OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id)));

CREATE POLICY "Insert own contacts" ON public.emergency_contacts
  FOR INSERT TO authenticated
  WITH CHECK (((team_id IS NULL) AND (user_id = auth.uid())) OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id)));

CREATE POLICY "Delete own contacts" ON public.emergency_contacts
  FOR DELETE TO authenticated
  USING (((team_id IS NULL) AND (user_id = auth.uid())) OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id)));

CREATE POLICY "Update own contacts" ON public.emergency_contacts
  FOR UPDATE TO authenticated
  USING (((team_id IS NULL) AND (user_id = auth.uid())) OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id)));

-- Trigger to auto-delete expired spreadsheets (and cascade contacts)
CREATE OR REPLACE FUNCTION public.cleanup_expired_spreadsheets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.emergency_spreadsheets WHERE expires_at < now();
  RETURN NULL;
END;
$$;

-- Run cleanup on every insert to spreadsheets
CREATE TRIGGER cleanup_expired_on_insert
  AFTER INSERT ON public.emergency_spreadsheets
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_spreadsheets();
