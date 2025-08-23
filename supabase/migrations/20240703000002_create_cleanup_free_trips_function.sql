-- Create a function to clean up expired free trips
CREATE OR REPLACE FUNCTION public.cleanup_expired_free_trips()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_date TIMESTAMPTZ;
  v_expiry_date TIMESTAMPTZ;
BEGIN
  -- Get current date
  v_current_date := CURRENT_TIMESTAMP;
  
  -- Delete all free trips that are older than 1 month from their first_usage_date
  DELETE FROM public.user_freenium
  WHERE first_usage_date + interval '1 month' <= v_current_date;
  
  -- Log the cleanup
  INSERT INTO public.audit_logs (
    action,
    table_name,
    details
  ) VALUES (
    'cleanup',
    'user_freenium',
    jsonb_build_object(
      'timestamp', v_current_date,
      'message', 'Cleaned up expired free trips'
    )
  );
END;
$$;

-- Create a table for audit logs if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a scheduled job to run the cleanup function
-- This will run at midnight on the first day of each month
SELECT cron.schedule(
  'cleanup-expired-free-trips',  -- job name
  '0 0 1 * *',                  -- cron schedule (midnight on 1st of each month)
  $$
  SELECT public.cleanup_expired_free_trips();
  $$
); 