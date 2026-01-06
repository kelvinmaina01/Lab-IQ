-- Enable RLS (already enabled, but good practice to ensure)
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Allow users to view invitations for their lab
CREATE POLICY "Users can view invitations for their lab"
  ON team_invitations FOR SELECT
  USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Allow users to create invitations for their lab
CREATE POLICY "Users can create invitations for their lab"
  ON team_invitations FOR INSERT
  WITH CHECK (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete invitations for their lab (e.g. revoke)
CREATE POLICY "Users can revoke invitations for their lab"
  ON team_invitations FOR DELETE
  USING (
    lab_id IN (
      SELECT lab_id FROM team_members WHERE user_id = auth.uid()
    )
  );
