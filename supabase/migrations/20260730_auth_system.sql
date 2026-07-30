-- Umurage Hub Auth System Migration
-- Adds missing profile fields and expands role enum for full registration flow

-- 1. Expand user_profiles role enum to support all account types
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'student';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'museum';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'cultural_institution';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'researcher';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'tourist_guide';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'community_member';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add full_name column to user_profiles if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN full_name text;
  END IF;
END $$;

-- 3. Add phone_number column to user_profiles if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN phone_number text;
  END IF;
END $$;

-- 4. Ensure existing profiles with role values are valid
-- No data migration needed — existing values are already valid

-- 5. Add index for username lookup performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles (username);

-- 6. Add index for email lookup performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles (email);