-- Populate existing profiles with residence_location from user metadata
-- This migration runs after adding the residence_location column

-- Update existing profiles with residence_location from auth.users metadata
UPDATE public.profiles 
SET residence_location = (
  SELECT raw_user_meta_data->>'residence_location' 
  FROM auth.users 
  WHERE auth.users.id = public.profiles.id
)
WHERE residence_location IS NULL 
AND EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = public.profiles.id 
  AND auth.users.raw_user_meta_data->>'residence_location' IS NOT NULL
);

-- Log the number of profiles updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % profiles with residence_location from user metadata', updated_count;
END $$;
