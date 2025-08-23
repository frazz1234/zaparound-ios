-- Add freenium column to user_roles table
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS freenium BOOLEAN DEFAULT NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_freenium ON public.user_roles(freenium);

-- Add comment
COMMENT ON COLUMN public.user_roles.freenium IS 'Indicates if the user has reached their freenium limit for the month'; 