-- Add Google Places details to community_posts table
ALTER TABLE public.community_posts
ADD COLUMN place_id VARCHAR(255),
ADD COLUMN place_lat DECIMAL(10, 8),
ADD COLUMN place_lng DECIMAL(11, 8),
ADD COLUMN place_types TEXT[],
ADD COLUMN place_rating DECIMAL(3, 2),
ADD COLUMN place_user_ratings_total INTEGER;

-- Add comments to the new columns
COMMENT ON COLUMN public.community_posts.place_id IS 'Google Places place_id for the location';
COMMENT ON COLUMN public.community_posts.place_lat IS 'Latitude of the place from Google Places';
COMMENT ON COLUMN public.community_posts.place_lng IS 'Longitude of the place from Google Places';
COMMENT ON COLUMN public.community_posts.place_types IS 'Array of place types from Google Places';
COMMENT ON COLUMN public.community_posts.place_rating IS 'Rating of the place from Google Places';
COMMENT ON COLUMN public.community_posts.place_user_ratings_total IS 'Total number of user ratings for the place';

-- Create index on place_id for faster lookups
CREATE INDEX idx_community_posts_place_id ON public.community_posts(place_id);

-- Create index on coordinates for location-based queries
CREATE INDEX idx_community_posts_coordinates ON public.community_posts(place_lat, place_lng); 