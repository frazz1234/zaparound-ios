-- Create a table to track free trip usage
CREATE TABLE IF NOT EXISTS public.user_freenium (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('zaproad', 'zaptrip', 'zapout')),
  trip_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_usage_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Create indices for faster lookups
  CONSTRAINT user_freenium_user_trip_unique UNIQUE (user_id, trip_id)
);

-- Enable Row Level Security on the table
ALTER TABLE public.user_freenium ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own free trip usage
CREATE POLICY "Users can view their own free trip usage"
  ON public.user_freenium
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own free trip usage
CREATE POLICY "Users can record their own free trip usage"
  ON public.user_freenium
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create a function to check if a user can use a free trip
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
    
  -- Return true if less than 5 trips used in current period
  RETURN v_count < 3;
END;
$$;

-- Create a function to record a free trip usage
CREATE OR REPLACE FUNCTION public.record_free_trip(
  p_user_id UUID,
  p_email TEXT,
  p_trip_type TEXT,
  p_trip_id UUID
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_free_trip_id UUID;
  v_first_usage_date TIMESTAMPTZ;
BEGIN
  -- Get the user's first usage date for this trip type
  SELECT MIN(first_usage_date)
  INTO v_first_usage_date
  FROM public.user_freenium
  WHERE user_id = p_user_id
    AND trip_type = p_trip_type;
    
  -- If no previous usage, use current timestamp as first usage date
  IF v_first_usage_date IS NULL THEN
    v_first_usage_date := CURRENT_TIMESTAMP;
  END IF;
  
  -- Insert the free trip record
  INSERT INTO public.user_freenium (
    user_id,
    email,
    trip_type,
    trip_id,
    first_usage_date
  ) VALUES (
    p_user_id,
    p_email,
    p_trip_type,
    p_trip_id,
    v_first_usage_date
  )
  RETURNING id INTO v_free_trip_id;
  
  RETURN v_free_trip_id;
END;
$$;

-- Create a function to get remaining free trips for a user
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
    
  -- If no previous usage, return 5 (full quota)
  IF v_first_usage_date IS NULL THEN
    RETURN 5;
  END IF;
  
  -- Get current date
  v_current_date := CURRENT_TIMESTAMP;
  
  -- Calculate next reset date (exactly 1 month from first usage)
  v_next_reset_date := v_first_usage_date + interval '1 month';
  
  -- Check if we're past the reset date
  IF v_current_date >= v_next_reset_date THEN
    RETURN 5;
  END IF;
  
  -- Count all free trips used in current period (across all trip types)
  SELECT COUNT(*)
  INTO v_count
  FROM public.user_freenium
  WHERE user_id = p_user_id
    AND created_at >= v_first_usage_date
    AND created_at < v_next_reset_date;
    
  -- Return remaining trips (5 - used)
  RETURN 5 - v_count;
END;
$$;

-- Create a function to get next reset date for free trips
CREATE OR REPLACE FUNCTION public.get_next_free_trips_reset(
  p_user_id UUID,
  p_trip_type TEXT
)
RETURNS TIMESTAMPTZ
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_first_usage_date TIMESTAMPTZ;
BEGIN
  -- Get the user's first usage date (across all trip types)
  SELECT MIN(first_usage_date)
  INTO v_first_usage_date
  FROM public.user_freenium
  WHERE user_id = p_user_id;
    
  -- If no previous usage, return current timestamp
  IF v_first_usage_date IS NULL THEN
    RETURN CURRENT_TIMESTAMP;
  END IF;
  
  -- Return exactly 1 month from first usage
  RETURN v_first_usage_date + interval '1 month';
END;
$$;

-- Create a function to create the free_trips table (to be called via RPC if needed)
CREATE OR REPLACE FUNCTION public.create_free_trips_table()
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the table exists already
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_freenium'
  ) THEN
    -- Create the table
    CREATE TABLE public.user_freenium (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      trip_type TEXT NOT NULL CHECK (trip_type IN ('zaproad', 'zaptrip', 'zapout')),
      trip_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      first_usage_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      
      -- Create indices for faster lookups
      CONSTRAINT user_freenium_user_trip_unique UNIQUE (user_id, trip_id)
    );
    
    -- Enable Row Level Security on the table
    ALTER TABLE public.user_freenium ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for users to view their own free trip usage
    CREATE POLICY "Users can view their own free trip usage"
      ON public.user_freenium
      FOR SELECT
      USING (auth.uid() = user_id);
    
    -- Create policy for users to insert their own free trip usage
    CREATE POLICY "Users can record their own free trip usage"
      ON public.user_freenium
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$; 