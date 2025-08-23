-- Add post_type column to community_posts table
ALTER TABLE community_posts 
ADD COLUMN post_type VARCHAR(20) DEFAULT 'activity' CHECK (post_type IN ('activity', 'destination'));

-- Set all existing posts as activities (since they were activities before this feature)
UPDATE community_posts 
SET post_type = 'activity' 
WHERE post_type IS NULL;

-- Create index for better performance when filtering by post_type
CREATE INDEX idx_community_posts_post_type ON community_posts(post_type);

-- Add comment for documentation
COMMENT ON COLUMN community_posts.post_type IS 'Type of post: activity (for hangout places) or destination (for travel/day trips)'; 