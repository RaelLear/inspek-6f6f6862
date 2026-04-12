
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  default_workspace text NOT NULL DEFAULT 'personal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access own settings" ON public.user_settings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (user_id = auth.uid());
