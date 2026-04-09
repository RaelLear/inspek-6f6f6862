
CREATE TABLE public.ports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ports" ON public.ports FOR ALL USING (true) WITH CHECK (true);
