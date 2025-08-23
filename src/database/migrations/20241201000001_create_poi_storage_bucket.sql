-- Create or update the storage bucket for POI category images
INSERT INTO storage.buckets (id, name, public)
VALUES ('zaparound-uploads', 'zaparound-uploads', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload POI images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to POI images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own POI images" ON storage.objects;

-- Create a policy to allow authenticated users to upload POI images
CREATE POLICY "Allow authenticated users to upload POI images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'zaparound-uploads' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'poi-categories'
);

-- Create a policy to allow public access to POI images
CREATE POLICY "Allow public access to POI images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'zaparound-uploads');

-- Create a policy to allow admin users to delete POI images
CREATE POLICY "Allow admin users to delete POI images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'zaparound-uploads' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create a policy to allow admin users to update POI images
CREATE POLICY "Allow admin users to update POI images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'zaparound-uploads' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'zaparound-uploads' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Add comment
COMMENT ON POLICY "Allow authenticated users to upload POI images" ON storage.objects IS 'Allows authenticated users to upload POI category images to the zaparound-uploads bucket';
COMMENT ON POLICY "Allow public access to POI images" ON storage.objects IS 'Allows public read access to POI category images';
COMMENT ON POLICY "Allow admin users to delete POI images" ON storage.objects IS 'Allows admin users to delete POI category images';
COMMENT ON POLICY "Allow admin users to update POI images" ON storage.objects IS 'Allows admin users to update POI category images'; 