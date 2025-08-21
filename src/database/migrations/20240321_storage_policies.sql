-- Create storage bucket for business logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to create buckets
CREATE POLICY "Allow authenticated users to create buckets"
ON storage.buckets FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to read buckets
CREATE POLICY "Allow authenticated users to read buckets"
ON storage.buckets FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update buckets
CREATE POLICY "Allow authenticated users to update buckets"
ON storage.buckets FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete buckets
CREATE POLICY "Allow authenticated users to delete buckets"
ON storage.buckets FOR DELETE
TO authenticated
USING (true);

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'business-logos' AND
    auth.uid() IS NOT NULL
);

-- Allow users to read their own files
CREATE POLICY "Allow users to read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'business-logos' AND
    auth.uid() IS NOT NULL
);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'business-logos' AND
    auth.uid() IS NOT NULL
);

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'business-logos' AND
    auth.uid() IS NOT NULL
)
WITH CHECK (
    bucket_id = 'business-logos' AND
    auth.uid() IS NOT NULL
); 