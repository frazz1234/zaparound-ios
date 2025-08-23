-- Update free trip limit from 5 to 3 trips per month
-- This migration updates the database functions to change the limit

-- Update the can_use_free_trip function
CREATE OR REPLACE FUNCTION public.can_use_free_trip(
  p_user_id UUID,
  p_trip_type TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_first_usage_date TIMESTAMPTZ;
  v_current_date TIMESTAMPTZ;
  v_next_reset_date TIMESTAMPTZ;
BEGIN
  -- Get the user's first usage date (across all trip types)
  SELECT MIN(first_usage_date)
  INTO v_first_usage_date
  FROM public.user_freenium
  WHERE user_id = p_user_id;
    
  -- If no previous usage, they can use a free trip
  IF v_first_usage_date IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Get current date
  v_current_date := CURRENT_TIMESTAMP;
  
  -- Calculate next reset date (exactly 1 month from first usage)
  v_next_reset_date := v_first_usage_date + interval '1 month';
  
  -- Check if we're past the reset date
  IF v_current_date >= v_next_reset_date THEN
    RETURN TRUE;
  END IF;
  
  -- Count all free trips used in current period (across all trip types)
  SELECT COUNT(*)
  INTO v_count
  FROM public.user_freenium
  WHERE user_id = p_user_id
    AND created_at >= v_first_usage_date
    AND created_at < v_next_reset_date;
    
  -- Return true if less than 3 trips used in current period (changed from 5)
  RETURN v_count < 3;
END;
$$;

-- Update the get_remaining_free_trips function
CREATE OR REPLACE FUNCTION public.get_remaining_free_trips(
  p_user_id UUID,
  p_trip_type TEXT
)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_first_usage_date TIMESTAMPTZ;
  v_current_date TIMESTAMPTZ;
  v_next_reset_date TIMESTAMPTZ;
BEGIN
  -- Clean up any expired trips first
  DELETE FROM public.user_freenium
  WHERE user_id = p_user_id
    AND first_usage_date + interval '1 month' <= CURRENT_TIMESTAMP;
  
  -- Get the user's first usage date (across all trip types)
  SELECT MIN(first_usage_date)
  INTO v_first_usage_date
  FROM public.user_freenium
  WHERE user_id = p_user_id;
    
  -- If no previous usage, return 3 (full quota) - changed from 5
  IF v_first_usage_date IS NULL THEN
    RETURN 3;
  END IF;
  
  -- Get current date
  v_current_date := CURRENT_TIMESTAMP;
  
  -- Calculate next reset date (exactly 1 month from first usage)
  v_next_reset_date := v_first_usage_date + interval '1 month';
  
  -- Check if we're past the reset date
  IF v_current_date >= v_next_reset_date THEN
    RETURN 3; -- Changed from 5
  END IF;
  
  -- Count all free trips used in current period (across all trip types)
  SELECT COUNT(*)
  INTO v_count
  FROM public.user_freenium
  WHERE user_id = p_user_id
    AND created_at >= v_first_usage_date
    AND created_at < v_next_reset_date;
    
  -- Return remaining trips (3 - used) - changed from 5
  RETURN 3 - v_count;
END;
$$; 