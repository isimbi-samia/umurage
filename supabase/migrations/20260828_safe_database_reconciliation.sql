-- Migration: 20260828_safe_database_reconciliation.sql
-- Purpose: Corrected non-destructive database reconciliation for Umurage Hub
-- IMPORTANT: PROPOSED MIGRATION — DO NOT EXECUTE UNTIL REVIEWED.

-- -----------------------------------------------------------------------------
-- 1. SELLER PROFILES & MARKETPLACE INFRASTRUCTURE
-- -----------------------------------------------------------------------------

-- Create sellers table if not exists (for artisan seller profiles)
CREATE TABLE IF NOT EXISTS public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  business_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  district text NOT NULL,
  city text NOT NULL,
  description text,
  payout_info text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure seller_id column exists on marketplace_products referencing profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'marketplace_products' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE public.marketplace_products ADD COLUMN seller_id uuid REFERENCES public.profiles(id);
  END IF;
END $$;

-- Explicitly reconcile marketplace_orders columns (existing table in live DB)
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS buyer_name text;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS delivery_instructions text;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS total_amount numeric;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS currency text DEFAULT 'RWF';
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Explicitly reconcile marketplace_order_items columns (existing table in live DB)
ALTER TABLE public.marketplace_order_items ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.marketplace_orders(id) ON DELETE CASCADE;
ALTER TABLE public.marketplace_order_items ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.marketplace_products(id) ON DELETE CASCADE;
ALTER TABLE public.marketplace_order_items ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.marketplace_order_items ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1;
ALTER TABLE public.marketplace_order_items ADD COLUMN IF NOT EXISTS unit_price numeric;
ALTER TABLE public.marketplace_order_items ADD COLUMN IF NOT EXISTS total_price numeric;

-- Payments Infrastructure Log Table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'RWF',
  status text DEFAULT 'pending',
  payment_method text,
  provider text,
  transaction_ref text UNIQUE DEFAULT gen_random_uuid()::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. COURSES & EDUCATIONAL ARCHITECTURE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  description text NOT NULL,
  category text DEFAULT 'Heritage',
  level text DEFAULT 'beginner',
  duration text DEFAULT '4 weeks',
  instructor_name text,
  instructor_id uuid REFERENCES public.profiles(id),
  xp integer DEFAULT 500,
  is_featured boolean DEFAULT false,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. SAVES & KNOWLEDGE BASE ARCHITECTURE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.heritage_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'recording',
  item_id text NOT NULL,
  item_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT heritage_saves_user_item_unique UNIQUE (user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS public.discussion_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.discussion_topics(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT discussion_saves_user_topic_unique UNIQUE (user_id, topic_id)
);

-- Cultural Knowledge Base (Default verification_status is 'pending'; no fake authority values)
CREATE TABLE IF NOT EXISTS public.cultural_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  language text DEFAULT 'en',
  topic text NOT NULL,
  content text NOT NULL,
  summary text,
  source_name text,
  source_url text,
  verification_status text DEFAULT 'pending',
  reviewer_name text,
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON public.sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller_id ON public.marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_id ON public.marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_heritage_saves_user_id ON public.heritage_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_saves_user_id ON public.discussion_saves(user_id);

-- -----------------------------------------------------------------------------
-- 5. REALTIME PUBLICATION EXTENSION
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.saves;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_replies;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
