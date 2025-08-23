-- Create post_replies table
CREATE TABLE IF NOT EXISTS public.post_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT post_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;

-- Allow users to read all replies
CREATE POLICY "Anyone can read replies"
ON public.post_replies
FOR SELECT
TO authenticated
USING (true);

-- Allow users to create replies
CREATE POLICY "Authenticated users can create replies"
ON public.post_replies
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users
        WHERE blocked_user_id = auth.uid()
    )
);

-- Allow users to update their own replies
CREATE POLICY "Users can update their own replies"
ON public.post_replies
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own replies
CREATE POLICY "Users can delete their own replies"
ON public.post_replies
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.post_replies IS 'Stores replies to community posts';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_post_replies_updated_at
    BEFORE UPDATE ON public.post_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 