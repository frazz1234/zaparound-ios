-- Enable RLS on indexnow_logs table if not already enabled
ALTER TABLE indexnow_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to perform all operations
CREATE POLICY admin_indexnow_logs_policy
    ON indexnow_logs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Allow public read access if needed (uncomment if you want public read access)
-- CREATE POLICY indexnow_logs_select_policy
--     ON indexnow_logs
--     FOR SELECT
--     TO public
--     USING (true); 