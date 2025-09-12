-- Create storage bucket for building images
INSERT INTO storage.buckets (id, name, public) VALUES ('building-images', 'building-images', true);

-- Create storage policies for building images
CREATE POLICY "Building images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'building-images');

CREATE POLICY "Users can upload building images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'building-images');

CREATE POLICY "Users can update building images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'building-images');

CREATE POLICY "Users can delete building images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'building-images');