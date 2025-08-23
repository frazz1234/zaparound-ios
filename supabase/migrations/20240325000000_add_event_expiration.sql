-- Add expiration_date column to event_suggestion table
ALTER TABLE public.event_suggestion
ADD COLUMN expiration_date timestamp with time zone;

-- Create a function to delete expired events with proper error handling
CREATE OR REPLACE FUNCTION delete_expired_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer;
BEGIN
    WITH deleted AS (
        DELETE FROM public.event_suggestion
        WHERE expiration_date < NOW()
        RETURNING id
    )
    SELECT count(*) INTO deleted_count FROM deleted;

    -- Log the deletion for monitoring purposes
    RAISE NOTICE 'Deleted % expired events', deleted_count;
    
    RETURN deleted_count;
EXCEPTION WHEN OTHERS THEN
    -- Log any errors that occur
    RAISE WARNING 'Error in delete_expired_events: %', SQLERRM;
    RETURN -1;
END;
$$;

-- Add comment to the column
COMMENT ON COLUMN public.event_suggestion.expiration_date IS 'The date when this event suggestion should be automatically removed';

-- Add index to improve performance of the deletion query
CREATE INDEX idx_event_suggestion_expiration
ON public.event_suggestion (expiration_date)
WHERE expiration_date IS NOT NULL; 