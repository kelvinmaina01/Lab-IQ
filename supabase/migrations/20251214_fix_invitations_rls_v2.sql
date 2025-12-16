-- Safely drop existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can view invitations for their lab" ON team_invitations;
DROP POLICY IF EXISTS "Users can create invitations for their lab" ON team_invitations;
DROP POLICY IF EXISTS "Users can revoke invitations for their lab" ON team_invitations;

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Re-create policies
-- 1. Allow viewing
CREATE POLICY "Users can view invitations for their lab"
  ON team_invitations FOR SELECT
  USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- 2. Allow creating (Invite)
CREATE POLICY "Users can create invitations for their lab"
  ON team_invitations FOR INSERT
  WITH CHECK (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- 3. Allow revoking
CREATE POLICY "Users can revoke invitations for their lab"
  ON team_invitations FOR DELETE
  USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );
