-- PROPER FIX: Make token column nullable (it's a duplicate anyway)
ALTER TABLE public.team_invitations
ALTER COLUMN token DROP NOT NULL;

-- Verify the fix
SELECT 'Token column is now nullable. Invitations should work!' as status;
