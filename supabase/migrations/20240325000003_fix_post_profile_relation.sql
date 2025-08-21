-- Add foreign key constraint to link community_posts with profiles
ALTER TABLE public.community_posts
ADD CONSTRAINT fk_community_posts_profiles
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Update the RLS policies to ensure proper access
CREATE POLICY "Enable read access for all users on profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Ensure the profiles table has the necessary columns
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN username text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN full_name text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN avatar_url text;
    END IF;
END $$; 