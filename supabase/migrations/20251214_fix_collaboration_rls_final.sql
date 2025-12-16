-- Allow users to join a team (insert themselves)
CREATE POLICY "Users can join a team"
ON team_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to create channels if they are in the lab
CREATE POLICY "Users can create channels in their lab"
ON chat_channels
FOR INSERT
WITH CHECK (
  lab_id IN (
    SELECT lab_id FROM team_members WHERE user_id = auth.uid()
  )
);
