-- Add cover_url column to profiles for profile cover image
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cover_url text;
  END IF;
END $$;