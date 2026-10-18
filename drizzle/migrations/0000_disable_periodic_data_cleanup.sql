DROP TRIGGER IF EXISTS cleanup_expired_on_insert ON public.emergency_spreadsheets;
CREATE OR REPLACE FUNCTION public.cleanup_expired_spreadsheets()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Retention is permanent: the legacy function must never delete records.
  RETURN NULL;
END;
$$;
COMMENT ON FUNCTION public.cleanup_expired_spreadsheets() IS 'DEPRECATED: automatic data cleanup disabled; retained as a non-deleting compatibility function.';
ALTER TABLE public.emergency_spreadsheets ALTER COLUMN expires_at SET DEFAULT 'infinity'::timestamptz;
COMMENT ON COLUMN public.emergency_spreadsheets.expires_at IS 'DEPRECATED: legacy expiry timestamps are ignored. Spreadsheets and their contacts have no automatic expiration.';
ALTER TABLE public.machine_inspection_records ALTER COLUMN photo_expires_at DROP DEFAULT;
COMMENT ON COLUMN public.machine_inspection_records.photo_expires_at IS 'DEPRECATED: inspection photos must not expire or be automatically deleted.';