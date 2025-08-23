-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user (required for pg_cron)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create the cron job to delete expired events
SELECT cron.schedule(
  'delete-expired-events',  -- name of the cron job
  '0 0 * * *',            -- run at midnight every day (cron expression)
  $$
    SELECT delete_expired_events();
  $$
); 