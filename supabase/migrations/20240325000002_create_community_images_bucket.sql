-- Create a storage bucket for community images
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true);

-- Create a policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-images' AND
  auth.role() = 'authenticated'
);

-- Create a policy to allow public access to images
CREATE POLICY "Allow public access to images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'community-images');

-- Create a policy to allow users to delete their own images
CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
); 