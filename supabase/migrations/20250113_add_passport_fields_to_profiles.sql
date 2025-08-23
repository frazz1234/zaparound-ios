-- Add passport information fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN passport_number text,
ADD COLUMN passport_country text,
ADD COLUMN passport_expiry_date date;

-- Create index for passport number lookups
CREATE INDEX idx_profiles_passport_number ON public.profiles(passport_number);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.passport_number IS 'Passport number for travel bookings';
COMMENT ON COLUMN public.profiles.passport_country IS 'Country that issued the passport';
COMMENT ON COLUMN public.profiles.passport_expiry_date IS 'Passport expiration date'; 