-- Fix RLS policy for pub_responses to allow users to update their own responses
-- This allows users to change their response (accept/deny) after initially responding

-- Drop existing UPDATE policy if it exists (in case it's too restrictive)
DROP POLICY IF EXISTS "Users can update their own responses" ON public.pub_responses;

-- Create policy to allow users to update their own responses
CREATE POLICY "Users can update their own responses"
  ON public.pub_responses
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

