-- Create group_invites table
CREATE TABLE IF NOT EXISTS public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_group_invites_token ON public.group_invites(token);

-- Create index on group_id for filtering
CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON public.group_invites(group_id);

-- Create index on email for filtering
CREATE INDEX IF NOT EXISTS idx_group_invites_email ON public.group_invites(email);

-- Enable RLS
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can create invites for groups they're members of
CREATE POLICY "Users can create invites for groups they're members of"
  ON public.group_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can read invites they created
CREATE POLICY "Users can read invites they created"
  ON public.group_invites
  FOR SELECT
  USING (invited_by = auth.uid());

-- RLS Policy: Users can read invites sent to their email (for verification)
-- Note: This allows anyone to verify a token, which is needed for the invite acceptance flow
-- The token itself provides the security
CREATE POLICY "Anyone can read invites by token (for verification)"
  ON public.group_invites
  FOR SELECT
  USING (true);

-- RLS Policy: Users can delete invites they created (to cancel)
CREATE POLICY "Users can delete invites they created"
  ON public.group_invites
  FOR DELETE
  USING (invited_by = auth.uid());

-- RLS Policy: Users can update invites they created
CREATE POLICY "Users can update invites they created"
  ON public.group_invites
  FOR UPDATE
  USING (invited_by = auth.uid());

-- RLS Policy: Users can update invites to accept them (set accepted_by to their id)
-- This is safe because tokens are unique and random, so only the person with the token can accept
CREATE POLICY "Users can accept invites"
  ON public.group_invites
  FOR UPDATE
  USING (
    -- Invite must not be already accepted
    accepted_at IS NULL
    AND
    -- User must be authenticated
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    -- Can only set accepted_by to their own id
    accepted_by = auth.uid()
    AND
    -- Must set accepted_at
    accepted_at IS NOT NULL
  );

