-- Add location column to community_posts table
ALTER TABLE public.community_posts
ADD COLUMN location VARCHAR(255);

-- Add comment to the column
COMMENT ON COLUMN public.community_posts.location IS 'The location where the post was created'; 