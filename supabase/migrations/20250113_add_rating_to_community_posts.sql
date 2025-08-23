-- Add rating column to community_posts table
ALTER TABLE community_posts 
ADD COLUMN rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5);

-- Add rating column to post_replies table as well
ALTER TABLE post_replies 
ADD COLUMN rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5);

-- Create index for better performance when querying by rating
CREATE INDEX idx_community_posts_rating ON community_posts(rating);
CREATE INDEX idx_post_replies_rating ON post_replies(rating);

-- Add comments for documentation
COMMENT ON COLUMN community_posts.rating IS 'User rating from 0 to 5 stars';
COMMENT ON COLUMN post_replies.rating IS 'User rating from 0 to 5 stars for replies'; 