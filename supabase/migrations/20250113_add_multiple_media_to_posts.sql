-- Add media_urls column to community_posts table
ALTER TABLE community_posts 
ADD COLUMN media_urls JSONB DEFAULT '[]'::jsonb;

-- Add media_urls column to post_replies table
ALTER TABLE post_replies 
ADD COLUMN media_urls JSONB DEFAULT '[]'::jsonb;

-- Create index for better performance when querying media
CREATE INDEX idx_community_posts_media_urls ON community_posts USING GIN (media_urls);
CREATE INDEX idx_post_replies_media_urls ON post_replies USING GIN (media_urls);

-- Add comment explaining the media_urls structure
COMMENT ON COLUMN community_posts.media_urls IS 'Array of media objects with structure: [{"id": "uuid", "url": "string", "type": "image|video", "thumbnail": "string"}]';
COMMENT ON COLUMN post_replies.media_urls IS 'Array of media objects with structure: [{"id": "uuid", "url": "string", "type": "image|video", "thumbnail": "string"}]';

-- Create function to validate media_urls JSON structure
CREATE OR REPLACE FUNCTION validate_media_urls()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if media_urls is an array
  IF NEW.media_urls IS NOT NULL AND jsonb_typeof(NEW.media_urls) != 'array' THEN
    RAISE EXCEPTION 'media_urls must be an array';
  END IF;
  
  -- Validate each media object in the array
  IF NEW.media_urls IS NOT NULL THEN
    FOR i IN 0..jsonb_array_length(NEW.media_urls) - 1 LOOP
      DECLARE
        media_obj jsonb;
        media_id text;
        media_url text;
        media_type text;
      BEGIN
        media_obj := NEW.media_urls->i;
        
        -- Check required fields
        IF NOT (media_obj ? 'id' AND media_obj ? 'url' AND media_obj ? 'type') THEN
          RAISE EXCEPTION 'Each media object must have id, url, and type fields';
        END IF;
        
        -- Extract values
        media_id := media_obj->>'id';
        media_url := media_obj->>'url';
        media_type := media_obj->>'type';
        
        -- Validate type
        IF media_type NOT IN ('image', 'video') THEN
          RAISE EXCEPTION 'Media type must be either "image" or "video"';
        END IF;
        
        -- Validate URL format (basic check)
        IF media_url IS NULL OR length(trim(media_url)) = 0 THEN
          RAISE EXCEPTION 'Media URL cannot be empty';
        END IF;
        
        -- Validate ID format (basic check)
        IF media_id IS NULL OR length(trim(media_id)) = 0 THEN
          RAISE EXCEPTION 'Media ID cannot be empty';
        END IF;
      END;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to validate media_urls
CREATE TRIGGER validate_community_posts_media_urls
  BEFORE INSERT OR UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_media_urls();

CREATE TRIGGER validate_post_replies_media_urls
  BEFORE INSERT OR UPDATE ON post_replies
  FOR EACH ROW
  EXECUTE FUNCTION validate_media_urls(); 