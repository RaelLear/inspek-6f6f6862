
-- Drop all existing restrictive policies and recreate as permissive

-- Extinguishers
DROP POLICY IF EXISTS "Users can delete own extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can insert own extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can select own extinguishers" ON public.extinguishers;
DROP POLICY IF EXISTS "Users can update own extinguishers" ON public.extinguishers;

CREATE POLICY "Users can select own extinguishers" ON public.extinguishers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own extinguishers" ON public.extinguishers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own extinguishers" ON public.extinguishers FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own extinguishers" ON public.extinguishers FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Inspections
DROP POLICY IF EXISTS "Users can delete own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can insert own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can select own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can update own inspections" ON public.inspections;

CREATE POLICY "Users can select own inspections" ON public.inspections FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own inspections" ON public.inspections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own inspections" ON public.inspections FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own inspections" ON public.inspections FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Ports
DROP POLICY IF EXISTS "Users can delete own ports" ON public.ports;
DROP POLICY IF EXISTS "Users can insert own ports" ON public.ports;
DROP POLICY IF EXISTS "Users can select own ports" ON public.ports;
DROP POLICY IF EXISTS "Users can update own ports" ON public.ports;

CREATE POLICY "Users can select own ports" ON public.ports FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own ports" ON public.ports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own ports" ON public.ports FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own ports" ON public.ports FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Make user_id NOT NULL with default on all tables (for new inserts)
ALTER TABLE public.extinguishers ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.inspections ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.ports ALTER COLUMN user_id SET DEFAULT auth.uid();
