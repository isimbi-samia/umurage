-- Add cover_url column to user_profiles for profile cover image
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN cover_url text;
  END IF;
END $$;