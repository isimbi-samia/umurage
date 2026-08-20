-- Umurage Hub Auth System Migration
-- Adds missing profile fields and expands role enum for full registration flow

-- 1. Expand user_profiles role enum to support all account types
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'creator', 'student', 'museum', 'cultural_institution', 'researcher', 'tourist_guide', 'community_member');
EXCEPTION WHEN duplicate_object THEN
  BEGIN ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'student'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'museum'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'cultural_institution'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'researcher'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'tourist_guide'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'community_member'; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 2. Add full_name column to profiles if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name text;
  END IF;
END $$;

-- 3. Add phone_number column to profiles if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone_number text;
  END IF;
END $$;

-- 4. Ensure existing profiles with role values are valid
-- No data migration needed — existing values are already valid

-- 5. Add index for username lookup performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- 6. Add index for email lookup performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);