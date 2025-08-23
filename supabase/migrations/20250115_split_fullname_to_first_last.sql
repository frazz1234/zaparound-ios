-- Split full_name column into first_name and last_name
-- This migration will preserve existing data by splitting the current full_name values

-- Add new columns
ALTER TABLE public.profiles 
ADD COLUMN first_name text,
ADD COLUMN last_name text;

-- Split existing full_name data into first_name and last_name
-- For names with spaces, split on first space
-- For names without spaces, put everything in first_name
UPDATE public.profiles 
SET 
  first_name = CASE 
    WHEN full_name IS NULL THEN NULL
    WHEN position(' ' in full_name) > 0 THEN split_part(full_name, ' ', 1)
    ELSE full_name
  END,
  last_name = CASE 
    WHEN full_name IS NULL THEN NULL
    WHEN position(' ' in full_name) > 0 THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE ''
  END;

-- Drop the old full_name column
ALTER TABLE public.profiles DROP COLUMN full_name;

-- Update the handle_new_user function to use first_name and last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, first_name, last_name, email)
  VALUES (
    new.id,
    lower(split_part(new.email, '@', 1)), -- Create a username from the email
    coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)), -- Use first name from metadata or email
    coalesce(new.raw_user_meta_data->>'last_name', ''), -- Use last name from metadata or empty string
    new.email -- Store the email directly
  );
  RETURN new;
END;
$$;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.first_name IS 'User first name';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name';
