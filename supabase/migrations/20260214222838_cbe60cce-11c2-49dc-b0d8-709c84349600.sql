
-- Extinguishers table
CREATE TABLE public.extinguishers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  port TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Pó ABC',
  weight TEXT NOT NULL DEFAULT '6kg',
  warranty_expiry TEXT,
  third_level TEXT,
  status TEXT NOT NULL DEFAULT 'Aprovado',
  review_send_date TEXT,
  review_return_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.extinguishers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to extinguishers" ON public.extinguishers FOR ALL USING (true) WITH CHECK (true);

-- Inspections table
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  extinguisher_id UUID REFERENCES public.extinguishers(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  port TEXT NOT NULL,
  inspection_date TEXT NOT NULL,
  manometer_status TEXT NOT NULL DEFAULT 'Conforme',
  seal_status TEXT NOT NULL DEFAULT 'Conforme',
  plate_status TEXT NOT NULL DEFAULT 'Conforme',
  floor_paint_status TEXT NOT NULL DEFAULT 'Conforme',
  plate_description TEXT,
  floor_paint_description TEXT,
  manometer_review_date TEXT,
  seal_review_date TEXT,
  review_return_date TEXT,
  warranty_expiry TEXT,
  third_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to inspections" ON public.inspections FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.extinguishers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspections;
