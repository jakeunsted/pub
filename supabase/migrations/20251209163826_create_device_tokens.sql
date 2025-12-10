-- Create device_tokens table
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on (user_id, token) to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_user_token ON public.device_tokens(user_id, token);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);

-- Create index on token for lookups
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON public.device_tokens(token);

-- Enable RLS
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can insert their own device tokens
CREATE POLICY "Users can insert their own device tokens"
  ON public.device_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can read their own device tokens
CREATE POLICY "Users can read their own device tokens"
  ON public.device_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own device tokens
CREATE POLICY "Users can update their own device tokens"
  ON public.device_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own device tokens
CREATE POLICY "Users can delete their own device tokens"
  ON public.device_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_device_tokens_updated_at
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_device_tokens_updated_at();

