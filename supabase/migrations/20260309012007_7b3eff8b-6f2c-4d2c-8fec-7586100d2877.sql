
-- Add can_inspect column to team_members for permission control
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS can_inspect boolean NOT NULL DEFAULT true;

-- Allow team owners to update team_members
CREATE POLICY "Owner can update members" ON public.team_members
FOR UPDATE USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

-- Fix: drop any unique constraint on ports.number alone to allow same port number across users/teams
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'public.ports'::regclass 
    AND contype = 'u'
    AND array_length(conkey, 1) = 1
  ) LOOP
    EXECUTE 'ALTER TABLE public.ports DROP CONSTRAINT ' || r.conname;
  END LOOP;
END $$;

-- Drop any unique index on just number
DROP INDEX IF EXISTS ports_number_key;
DROP INDEX IF EXISTS ports_number_idx;
DROP INDEX IF EXISTS ports_number_unique;

-- Create composite unique index scoped to user/team
CREATE UNIQUE INDEX IF NOT EXISTS ports_number_user_team_unique 
ON public.ports (number, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid));
