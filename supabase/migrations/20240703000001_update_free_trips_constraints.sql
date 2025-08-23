-- Drop the old unique constraint on email
ALTER TABLE public.user_freenium DROP CONSTRAINT IF EXISTS user_freenium_email_unique;

-- Add the new unique constraint on user_id and trip_id
ALTER TABLE public.user_freenium ADD CONSTRAINT user_freenium_user_trip_unique UNIQUE (user_id, trip_id); 