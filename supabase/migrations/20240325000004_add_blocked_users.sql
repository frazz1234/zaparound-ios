-- Create blocked_users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(blocked_user_id, blocked_by_id)
);

-- Add RLS policies
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Allow admins and moderators to manage blocked users
CREATE POLICY "Admins and moderators can manage blocked users"
ON public.blocked_users
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND (role = 'admin' OR role2 = 'moderator')
    )
);

-- Allow users to see if they are blocked
CREATE POLICY "Users can see if they are blocked"
ON public.blocked_users
FOR SELECT
TO authenticated
USING (
    blocked_user_id = auth.uid()
    OR blocked_by_id = auth.uid()
);

-- Add comment
COMMENT ON TABLE public.blocked_users IS 'Tracks users who have been blocked from posting in the community'; 