-- =====================================================
-- FIX: Create Missing Tables for Invitations
-- =====================================================

-- 1. Create team_invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    lab_id UUID REFERENCES public.labs(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'researcher', 'guest')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invitation_token TEXT UNIQUE NOT NULL,
    email_sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_lab_id ON public.team_invitations(lab_id);

-- 2. Create activity_feed table (if collaboration_activity doesn't exist)
CREATE TABLE IF NOT EXISTS public.collaboration_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID REFERENCES public.labs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_lab_id ON public.collaboration_activity(lab_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_user_id ON public.collaboration_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_created_at ON public.collaboration_activity(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_activity ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for team_invitations

-- Allow authenticated users to create invitations
CREATE POLICY "Users can create invitations for their labs"
ON public.team_invitations
FOR INSERT
TO authenticated
WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE user_id = auth.uid()
        AND lab_id = team_invitations.lab_id
        AND role IN ('admin', 'owner')
    )
);

-- Allow users to view invitations for their labs
CREATE POLICY "Users can view invitations for their labs"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE user_id = auth.uid()
        AND lab_id = team_invitations.lab_id
    )
);

-- Allow anyone with the token to view their invitation (for acceptance page)
CREATE POLICY "Anyone can view invitation by token"
ON public.team_invitations
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow users to update invitations (for acceptance)
CREATE POLICY "Users can update their own invitations"
ON public.team_invitations
FOR UPDATE
TO authenticated
USING (email = auth.jwt()->>'email' OR invited_by = auth.uid());

-- 5. RLS Policies for collaboration_activity

-- Allow users to view activity for their labs
CREATE POLICY "Users can view activity for their labs"
ON public.collaboration_activity
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE user_id = auth.uid()
        AND lab_id = collaboration_activity.lab_id
    )
);

-- Allow users to create activity for their labs
CREATE POLICY "Users can create activity for their labs"
ON public.collaboration_activity
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE user_id = auth.uid()
        AND lab_id = collaboration_activity.lab_id
    )
);

-- 6. Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Add trigger for team_invitations
DROP TRIGGER IF EXISTS set_updated_at ON public.team_invitations;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. Grant necessary permissions
GRANT ALL ON public.team_invitations TO authenticated;
GRANT ALL ON public.team_invitations TO service_role;
GRANT SELECT ON public.team_invitations TO anon;

GRANT ALL ON public.collaboration_activity TO authenticated;
GRANT ALL ON public.collaboration_activity TO service_role;

-- =====================================================
-- SUCCESS! Tables created and secured
-- =====================================================
-- Now you can:
-- 1. Send team invitations
-- 2. Track collaboration activity
-- 3. Accept invitations via token
-- =====================================================
