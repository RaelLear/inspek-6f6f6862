
-- Add image_url column to ports
ALTER TABLE public.ports ADD COLUMN image_url text DEFAULT NULL;

-- Create storage bucket for port images
INSERT INTO storage.buckets (id, name, public) VALUES ('port-images', 'port-images', true);

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'port-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'port-images');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'port-images');

-- Allow authenticated users to update
CREATE POLICY "Authenticated update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'port-images');
