
-- Add email to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update trigger to store email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  base_username := LOWER(REPLACE(COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  ), ' ', ''));

  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || '_' || substr(md5(random()::text), 1, 4);
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, email)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'username'
    ),
    NEW.email
  );

  INSERT INTO public.subscriptions (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill existing profiles with email
UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE p.id = u.id AND p.email IS NULL;

-- Monthly review counts table
CREATE TABLE public.monthly_review_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  team_id uuid,
  month integer NOT NULL,
  year integer NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX monthly_review_counts_unique ON public.monthly_review_counts (user_id, COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid), month, year);

ALTER TABLE public.monthly_review_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access review counts" ON public.monthly_review_counts FOR SELECT TO authenticated
  USING ((team_id IS NULL AND user_id = auth.uid()) OR (team_id IS NOT NULL AND is_team_member(auth.uid(), team_id)));

CREATE POLICY "Insert review counts" ON public.monthly_review_counts FOR INSERT TO authenticated
  WITH CHECK ((team_id IS NULL AND user_id = auth.uid()) OR (team_id IS NOT NULL AND is_team_member(auth.uid(), team_id)));

CREATE POLICY "Update review counts" ON public.monthly_review_counts FOR UPDATE TO authenticated
  USING ((team_id IS NULL AND user_id = auth.uid()) OR (team_id IS NOT NULL AND is_team_member(auth.uid(), team_id)));
