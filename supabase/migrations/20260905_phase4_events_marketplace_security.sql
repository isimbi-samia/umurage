-- ============================================================================
-- Migration: 20260905_phase4_events_marketplace_security.sql
-- Description: Phase 4 Security Hardening, PII Protection & Counter Integrity
-- Note: Transaction-safe, scoped to Phase 4. DO NOT APPLY TO LIVE DB YET.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Public Seller Architecture & PII Protection
-- ----------------------------------------------------------------------------
-- Revoke direct public select on sellers table to protect phone, email & payout_info
DROP POLICY IF EXISTS "sellers_select_public" ON public.sellers;
DROP POLICY IF EXISTS "sellers_select_owner_or_admin" ON public.sellers;

CREATE POLICY "sellers_select_owner_or_admin"
  ON public.sellers
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.is_admin_user(auth.uid())
  );

-- Restricted Public Seller Directory View (Exposes ONLY non-PII shop info)
CREATE OR REPLACE VIEW public.public_sellers AS
SELECT 
  id,
  user_id,
  business_name,
  district,
  city,
  description,
  status,
  created_at
FROM public.sellers
WHERE status = 'approved';

GRANT SELECT ON public.public_sellers TO anon, authenticated;

-- Prevent sellers from modifying status or user_id during UPDATE
CREATE OR REPLACE FUNCTION public.protect_seller_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user(auth.uid()) THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Non-admin users cannot modify seller status.';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Cannot reassign seller user_id.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_seller_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_seller_fields ON public.sellers;
CREATE TRIGGER trg_protect_seller_fields
BEFORE UPDATE ON public.sellers
FOR EACH ROW EXECUTE FUNCTION public.protect_seller_fields();

-- ----------------------------------------------------------------------------
-- 2. Marketplace Product Security & Admin Column Protection
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_insert_seller" ON public.marketplace_products;
DROP POLICY IF EXISTS "products_insert_approved_seller" ON public.marketplace_products;
DROP POLICY IF EXISTS "Users create marketplace products" ON public.marketplace_products;

CREATE POLICY "products_insert_approved_seller"
  ON public.marketplace_products
  FOR INSERT
  WITH CHECK (
    (auth.role() = 'authenticated') 
    AND (auth.uid() = seller_id)
    AND EXISTS (
      SELECT 1 FROM public.sellers
      WHERE sellers.user_id = auth.uid()
        AND sellers.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "products_update_seller" ON public.marketplace_products;
DROP POLICY IF EXISTS "Users update own products" ON public.marketplace_products;

CREATE POLICY "products_update_seller"
  ON public.marketplace_products
  FOR UPDATE
  USING (
    auth.uid() = seller_id
    AND EXISTS (
      SELECT 1 FROM public.sellers
      WHERE sellers.user_id = auth.uid()
        AND sellers.status = 'approved'
    )
  );

CREATE OR REPLACE FUNCTION public.protect_product_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user(auth.uid()) THEN
    IF NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
      RAISE EXCEPTION 'Cannot reassign product seller_id.';
    END IF;
    IF NEW.verified IS DISTINCT FROM OLD.verified THEN
      RAISE EXCEPTION 'Only administrators can alter product verified state.';
    END IF;
    IF NEW.is_featured IS DISTINCT FROM OLD.is_featured THEN
      RAISE EXCEPTION 'Only administrators can alter product featured status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_product_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_product_fields ON public.marketplace_products;
CREATE TRIGGER trg_protect_product_fields
BEFORE UPDATE ON public.marketplace_products
FOR EACH ROW EXECUTE FUNCTION public.protect_product_fields();

-- ----------------------------------------------------------------------------
-- 3. Event RSVP Privacy, Constraints & Automatic Counter Sync
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_event_registration'
  ) THEN
    ALTER TABLE public.event_registrations 
    ADD CONSTRAINT unique_user_event_registration UNIQUE (event_id, user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_event_registration_status'
  ) THEN
    ALTER TABLE public.event_registrations
    ADD CONSTRAINT check_event_registration_status 
    CHECK (status IN ('attending', 'going', 'interested', 'not_going'));
  END IF;
END $$;

DROP POLICY IF EXISTS "Public read event_registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_select_authorized" ON public.event_registrations;

CREATE POLICY "event_registrations_select_authorized"
  ON public.event_registrations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.cultural_events ev
      WHERE ev.id = event_registrations.event_id
        AND (ev.creator_id = auth.uid() OR ev.user_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.sync_event_rsvp_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE public.cultural_events
    SET 
      rsvp_count = (
        SELECT COUNT(*) FROM public.event_registrations 
        WHERE event_id = NEW.event_id AND status IN ('going', 'attending')
      ),
      attendees_count = (
        SELECT COUNT(*) FROM public.event_registrations 
        WHERE event_id = NEW.event_id AND status IN ('going', 'attending')
      ),
      updated_at = NOW()
    WHERE id = NEW.event_id;

    IF TG_OP = 'UPDATE' AND OLD.event_id IS DISTINCT FROM NEW.event_id THEN
      UPDATE public.cultural_events
      SET 
        rsvp_count = (
          SELECT COUNT(*) FROM public.event_registrations 
          WHERE event_id = OLD.event_id AND status IN ('going', 'attending')
        ),
        attendees_count = (
          SELECT COUNT(*) FROM public.event_registrations 
          WHERE event_id = OLD.event_id AND status IN ('going', 'attending')
        ),
        updated_at = NOW()
      WHERE id = OLD.event_id;
    END IF;

    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.cultural_events
    SET 
      rsvp_count = (
        SELECT COUNT(*) FROM public.event_registrations 
        WHERE event_id = OLD.event_id AND status IN ('going', 'attending')
      ),
      attendees_count = (
        SELECT COUNT(*) FROM public.event_registrations 
        WHERE event_id = OLD.event_id AND status IN ('going', 'attending')
      ),
      updated_at = NOW()
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_event_rsvp_count() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_event_rsvp_count ON public.event_registrations;
CREATE TRIGGER trg_sync_event_rsvp_count
AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.sync_event_rsvp_count();

UPDATE public.cultural_events ev
SET 
  rsvp_count = (
    SELECT COUNT(*) FROM public.event_registrations reg 
    WHERE reg.event_id = ev.id AND reg.status IN ('going', 'attending')
  ),
  attendees_count = (
    SELECT COUNT(*) FROM public.event_registrations reg 
    WHERE reg.event_id = ev.id AND reg.status IN ('going', 'attending')
  );

-- ----------------------------------------------------------------------------
-- 4. Server-Side Atomic Order Creation RPC (Hardened Stock & Price Validation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_marketplace_order(
  p_product_id UUID,
  p_quantity INT,
  p_buyer_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_delivery_address TEXT,
  p_district TEXT,
  p_city TEXT,
  p_delivery_instructions TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id UUID;
  v_seller_id UUID;
  v_unit_price NUMERIC;
  v_currency TEXT;
  v_stock_count INT;
  v_available BOOLEAN;
  v_total_amount NUMERIC;
  v_order_id UUID;
  v_clean_email TEXT;
  v_clean_instructions TEXT;
BEGIN
  -- 1. Validate Buyer Authentication
  v_buyer_id := auth.uid();
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to place an order.';
  END IF;

  -- 2. Validate Required Inputs
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Quantity must be at least 1.';
  END IF;

  IF p_buyer_name IS NULL OR TRIM(p_buyer_name) = '' THEN
    RAISE EXCEPTION 'Buyer name is required.';
  END IF;

  IF p_phone IS NULL OR TRIM(p_phone) = '' THEN
    RAISE EXCEPTION 'Phone number is required for delivery.';
  END IF;

  IF p_delivery_address IS NULL OR TRIM(p_delivery_address) = '' THEN
    RAISE EXCEPTION 'Delivery address is required.';
  END IF;

  IF p_district IS NULL OR TRIM(p_district) = '' THEN
    RAISE EXCEPTION 'Delivery district is required.';
  END IF;

  IF p_city IS NULL OR TRIM(p_city) = '' THEN
    RAISE EXCEPTION 'Delivery city is required.';
  END IF;

  -- Optional input cleaning
  v_clean_email := CASE WHEN p_email IS NOT NULL AND TRIM(p_email) <> '' THEN TRIM(p_email) ELSE NULL END;
  v_clean_instructions := CASE WHEN p_delivery_instructions IS NOT NULL AND TRIM(p_delivery_instructions) <> '' THEN TRIM(p_delivery_instructions) ELSE NULL END;

  -- 3. Lock & Fetch Product Details Server-Side
  SELECT seller_id, price, COALESCE(currency, 'RWF'), stock_count, COALESCE(available, true)
  INTO v_seller_id, v_unit_price, v_currency, v_stock_count, v_available
  FROM public.marketplace_products
  WHERE id = p_product_id
  FOR UPDATE;

  IF v_unit_price IS NULL OR v_unit_price <= 0 THEN
    RAISE EXCEPTION 'Product not found or has an invalid price.';
  END IF;

  IF NOT v_available THEN
    RAISE EXCEPTION 'Product is currently unavailable for purchase.';
  END IF;

  -- 4. Reject Purchasing Own Product
  IF v_seller_id = v_buyer_id THEN
    RAISE EXCEPTION 'Sellers cannot purchase their own products.';
  END IF;

  -- 5. Verify Seller is Active & Approved
  IF NOT EXISTS (
    SELECT 1 FROM public.sellers 
    WHERE user_id = v_seller_id AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Product seller is not an active approved seller.';
  END IF;

  -- 6. Strict Stock Concurrency & Inventory Validation
  IF v_stock_count IS NOT NULL THEN
    IF v_stock_count = 0 THEN
      RAISE EXCEPTION 'Product is currently out of stock.';
    ELSIF v_stock_count > 0 THEN
      IF p_quantity > v_stock_count THEN
        RAISE EXCEPTION 'Requested quantity exceeds available stock (% units remaining).', v_stock_count;
      END IF;

      -- Decrement stock and update availability if remaining stock is 0
      UPDATE public.marketplace_products
      SET 
        stock_count = stock_count - p_quantity,
        available = (stock_count - p_quantity > 0),
        updated_at = NOW()
      WHERE id = p_product_id;
    END IF;
  END IF;

  -- 7. Calculate Server-Side Totals
  v_total_amount := v_unit_price * p_quantity;

  -- 8. Create Order Record
  INSERT INTO public.marketplace_orders (
    buyer_id, buyer_name, phone, email, delivery_address,
    district, city, delivery_instructions, total_amount, currency, status
  ) VALUES (
    v_buyer_id, TRIM(p_buyer_name), TRIM(p_phone), v_clean_email, TRIM(p_delivery_address),
    TRIM(p_district), TRIM(p_city), v_clean_instructions, v_total_amount, v_currency, 'pending'
  ) RETURNING id INTO v_order_id;

  -- 9. Create Order Item Record
  INSERT INTO public.marketplace_order_items (
    order_id, product_id, seller_id, quantity, unit_price, total_price
  ) VALUES (
    v_order_id, p_product_id, v_seller_id, p_quantity, v_unit_price, v_total_amount
  );

  -- 10. Create Pending Pay on Delivery Record (transaction_ref NULL until actual payment)
  INSERT INTO public.payments (
    order_id, user_id, amount, currency, status, payment_method, provider, transaction_ref
  ) VALUES (
    v_order_id, v_buyer_id, v_total_amount, v_currency, 'pending', 'Pay on Delivery', 'pay_on_delivery', NULL
  );

  RETURN v_order_id;
END;
$$;

-- Secure Function EXECUTE Grants
REVOKE ALL ON FUNCTION public.create_marketplace_order(UUID, INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_marketplace_order(UUID, INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_marketplace_order(UUID, INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMIT;
