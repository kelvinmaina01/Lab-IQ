-- Fix: Add 'token' column as alias or add it separately
-- The table has 'invitation_token' but code might be looking for 'token'

-- Option 1: Add 'token' column that mirrors invitation_token (simpler)
ALTER TABLE public.team_invitations
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_token_new ON public.team_invitations(token);

-- Option 2: Update existing data to use invitation_token
-- (Run this if you have existing rows)
UPDATE public.team_invitations
SET token = invitation_token
WHERE token IS NULL AND invitation_token IS NOT NULL;

-- Success message
SELECT 'Token column added successfully!' as message;
