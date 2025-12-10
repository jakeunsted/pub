-- Add push_notifications_enabled column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_push_notifications_enabled ON public.profiles(push_notifications_enabled);

