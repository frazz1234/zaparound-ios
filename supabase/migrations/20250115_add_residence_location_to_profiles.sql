-- Add residence_location column to profiles table
-- This column stores the user's residence location for travel planning

ALTER TABLE public.profiles 
ADD COLUMN residence_location text;

-- Create index for location-based queries
CREATE INDEX idx_profiles_residence_location ON public.profiles(residence_location);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.residence_location IS 'User residence location for travel planning and local recommendations';

-- Update the handle_new_user function to include residence_location
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, first_name, last_name, email, residence_location)
  VALUES (
    new.id,
    lower(split_part(new.email, '@', 1)), -- Create a username from the email
    coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)), -- Use first name from metadata or email
    coalesce(new.raw_user_meta_data->>'last_name', ''), -- Use last name from metadata or empty string
    new.email, -- Store the email directly
    new.raw_user_meta_data->>'residence_location' -- Store residence location from metadata
  );
  RETURN new;
END;
$$;
