BEGIN;

-- Migration: 20260829_strict_rls_security_policies.sql
-- Purpose: Final Complete Reconciled PostgreSQL RLS Security Migration for Umurage Hub
-- IMPORTANT: COMPLETE EXECUTABLE MIGRATION — WRAPPED IN A SINGLE TRANSACTION BLOCK.

-- =============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultural_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heritage_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heritage_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultural_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. COMPREHENSIVE DROP OF ALL HISTORICAL / PERMISSIVE POLICIES & TRIGGERS
-- (Removes policy dependencies before dropping/recreating helper functions)
-- =============================================================================

-- Drop Triggers
DROP TRIGGER IF EXISTS trg_prevent_seller_status_tampering ON public.sellers;

-- Profiles
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_owner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;

-- Posts
DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_all" ON public.posts;
DROP POLICY IF EXISTS "posts_update_all" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_all" ON public.posts;
DROP POLICY IF EXISTS "posts_select_public" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_auth" ON public.posts;
DROP POLICY IF EXISTS "posts_update_owner" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_owner" ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

-- Stories
DROP POLICY IF EXISTS "stories_select_all" ON public.stories;
DROP POLICY IF EXISTS "stories_insert_all" ON public.stories;
DROP POLICY IF EXISTS "stories_update_all" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_all" ON public.stories;
DROP POLICY IF EXISTS "stories_select_public" ON public.stories;
DROP POLICY IF EXISTS "stories_insert_owner" ON public.stories;
DROP POLICY IF EXISTS "stories_update_owner" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_owner" ON public.stories;
DROP POLICY IF EXISTS "Stories viewable by everyone" ON public.stories;

-- Comments
DROP POLICY IF EXISTS "comments_select_public" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_owner" ON public.comments;
DROP POLICY IF EXISTS "comments_update_owner" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_owner" ON public.comments;

-- Likes
DROP POLICY IF EXISTS "likes_select_public" ON public.likes;
DROP POLICY IF EXISTS "likes_insert_owner" ON public.likes;
DROP POLICY IF EXISTS "likes_delete_owner" ON public.likes;

-- Saves
DROP POLICY IF EXISTS "saves_select_owner" ON public.saves;
DROP POLICY IF EXISTS "saves_insert_owner" ON public.saves;
DROP POLICY IF EXISTS "saves_delete_owner" ON public.saves;

-- Follows
DROP POLICY IF EXISTS "follows_select_public" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_owner" ON public.follows;
DROP POLICY IF EXISTS "follows_delete_owner" ON public.follows;

-- Notifications
DROP POLICY IF EXISTS "notifications_select_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_owner" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_auth" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_actor" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_owner" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_owner" ON public.notifications;

-- Conversations, Members, Messages
DROP POLICY IF EXISTS "conv_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conv_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "cm_select_policy" ON public.conversation_members;
DROP POLICY IF EXISTS "cm_insert_policy" ON public.conversation_members;
DROP POLICY IF EXISTS "msg_select_policy" ON public.messages;
DROP POLICY IF EXISTS "msg_insert_policy" ON public.messages;

-- Products & Sellers
DROP POLICY IF EXISTS "products_select_public" ON public.marketplace_products;
DROP POLICY IF EXISTS "products_insert_seller" ON public.marketplace_products;
DROP POLICY IF EXISTS "products_update_seller" ON public.marketplace_products;
DROP POLICY IF EXISTS "products_delete_seller" ON public.marketplace_products;
DROP POLICY IF EXISTS "Public read products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Sellers manage own products" ON public.marketplace_products;

DROP POLICY IF EXISTS "sellers_select_public" ON public.sellers;
DROP POLICY IF EXISTS "sellers_insert_owner" ON public.sellers;
DROP POLICY IF EXISTS "sellers_update_owner" ON public.sellers;
DROP POLICY IF EXISTS "sellers_admin_manage" ON public.sellers;
DROP POLICY IF EXISTS "Public read approved sellers" ON public.sellers;
DROP POLICY IF EXISTS "Sellers manage own profile" ON public.sellers;

-- Marketplace Orders & Items
DROP POLICY IF EXISTS "orders_select_buyer_seller" ON public.marketplace_orders;
DROP POLICY IF EXISTS "orders_insert_buyer" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Buyers view own orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Buyers insert own orders" ON public.marketplace_orders;

DROP POLICY IF EXISTS "order_items_select_authorized" ON public.marketplace_order_items;
DROP POLICY IF EXISTS "order_items_insert_buyer" ON public.marketplace_order_items;
DROP POLICY IF EXISTS "Order items visible to order buyer or seller" ON public.marketplace_order_items;
DROP POLICY IF EXISTS "Buyers insert order items" ON public.marketplace_order_items;

-- Payments
DROP POLICY IF EXISTS "payments_select_owner" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_owner" ON public.payments;
DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users create own payments" ON public.payments;

-- Courses & Enrollments
DROP POLICY IF EXISTS "courses_select_public" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_manage" ON public.courses;
DROP POLICY IF EXISTS "Public read courses" ON public.courses;
DROP POLICY IF EXISTS "enrollments_select_owner" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert_owner" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_update_owner" ON public.enrollments;

-- Heritage
DROP POLICY IF EXISTS "heritage_recordings_select_public" ON public.heritage_recordings;
DROP POLICY IF EXISTS "heritage_recordings_insert_owner" ON public.heritage_recordings;
DROP POLICY IF EXISTS "heritage_recordings_update_owner" ON public.heritage_recordings;
DROP POLICY IF EXISTS "heritage_recordings_delete_owner" ON public.heritage_recordings;
DROP POLICY IF EXISTS "heritage_saves_select_owner" ON public.heritage_saves;
DROP POLICY IF EXISTS "heritage_saves_insert_owner" ON public.heritage_saves;
DROP POLICY IF EXISTS "heritage_saves_delete_owner" ON public.heritage_saves;
DROP POLICY IF EXISTS "Users manage own heritage_saves" ON public.heritage_saves;

-- Discussions
DROP POLICY IF EXISTS "discussion_topics_select_public" ON public.discussion_topics;
DROP POLICY IF EXISTS "discussion_topics_insert_owner" ON public.discussion_topics;
DROP POLICY IF EXISTS "discussion_topics_update_owner" ON public.discussion_topics;
DROP POLICY IF EXISTS "discussion_topics_delete_owner" ON public.discussion_topics;
DROP POLICY IF EXISTS "discussion_replies_select_public" ON public.discussion_replies;
DROP POLICY IF EXISTS "discussion_replies_insert_owner" ON public.discussion_replies;
DROP POLICY IF EXISTS "discussion_replies_delete_owner" ON public.discussion_replies;
DROP POLICY IF EXISTS "discussion_votes_select_owner" ON public.discussion_votes;
DROP POLICY IF EXISTS "discussion_votes_insert_owner" ON public.discussion_votes;
DROP POLICY IF EXISTS "discussion_votes_update_owner" ON public.discussion_votes;
DROP POLICY IF EXISTS "discussion_votes_delete_owner" ON public.discussion_votes;
DROP POLICY IF EXISTS "discussion_saves_select_owner" ON public.discussion_saves;
DROP POLICY IF EXISTS "discussion_saves_insert_owner" ON public.discussion_saves;
DROP POLICY IF EXISTS "discussion_saves_delete_owner" ON public.discussion_saves;
DROP POLICY IF EXISTS "Users manage own discussion_saves" ON public.discussion_saves;

-- Cultural Knowledge, Verification, Events, Analytics, Library
DROP POLICY IF EXISTS "cultural_knowledge_select_public" ON public.cultural_knowledge;
DROP POLICY IF EXISTS "cultural_knowledge_admin_manage" ON public.cultural_knowledge;
DROP POLICY IF EXISTS "Public read cultural_knowledge" ON public.cultural_knowledge;

DROP POLICY IF EXISTS "verification_select_owner_admin" ON public.verification_applications;
DROP POLICY IF EXISTS "verification_insert_owner" ON public.verification_applications;
DROP POLICY IF EXISTS "verification_admin_manage" ON public.verification_applications;

DROP POLICY IF EXISTS "cultural_events_select_public" ON public.cultural_events;
DROP POLICY IF EXISTS "cultural_events_insert_owner" ON public.cultural_events;
DROP POLICY IF EXISTS "cultural_events_update_owner" ON public.cultural_events;
DROP POLICY IF EXISTS "cultural_events_delete_owner" ON public.cultural_events;
DROP POLICY IF EXISTS "Public read events" ON public.cultural_events;
DROP POLICY IF EXISTS "Auth create events" ON public.cultural_events;

DROP POLICY IF EXISTS "event_registrations_select_owner" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_insert_owner" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_delete_owner" ON public.event_registrations;

DROP POLICY IF EXISTS "content_views_insert_public" ON public.content_views;
DROP POLICY IF EXISTS "Public record content views" ON public.content_views;

DROP POLICY IF EXISTS "library_items_select_public" ON public.library_items;
DROP POLICY IF EXISTS "Public read library items" ON public.library_items;

-- =============================================================================
-- 3. DROP PRE-EXISTING HELPER FUNCTIONS SAFELY
-- (Avoids PostgreSQL 42P13 parameter name mismatch error)
-- =============================================================================

DROP FUNCTION IF EXISTS public.is_conversation_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_order_seller(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.prevent_seller_status_tampering() CASCADE;

-- =============================================================================
-- 4. RECREATE SECURITY DEFINER HELPER FUNCTIONS (HARDENED)
-- =============================================================================

-- Helper 1: Conversation Membership Check (Prevents conversation_members RLS recursion)
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
$$;

-- Helper 2: Marketplace Order Seller Check (Prevents circular order/order-item RLS recursion)
CREATE OR REPLACE FUNCTION public.is_order_seller(p_order_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.marketplace_order_items
    WHERE order_id = p_order_id AND seller_id = p_user_id
  );
$$;

-- Helper 3: Admin User Check
CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND is_admin = true
  );
$$;

-- Function Privileges Hardening
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_order_seller(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_order_seller(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated, service_role;

-- =============================================================================
-- 5. TRIGGER FUNCTION FOR SELLER STATUS PROTECTION (NO SAME-TABLE RLS RECURSION)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_seller_status_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent non-admins from modifying status column
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.is_admin_user(auth.uid()) THEN
      NEW.status := OLD.status; -- Revert unauthorized status modification
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_seller_status_tampering() FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_seller_status_tampering() TO service_role;

CREATE TRIGGER trg_prevent_seller_status_tampering
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_seller_status_tampering();

-- =============================================================================
-- 6. PUBLIC SAFE PROFILES VIEW (PRESERVE PII PRIVACY)
-- =============================================================================

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  bio,
  role,
  verified,
  verified_type,
  followers_count,
  following_count,
  posts_count,
  created_at
FROM public.profiles;

CREATE OR REPLACE VIEW public.user_profiles AS
SELECT * FROM public.public_profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;
GRANT SELECT ON public.user_profiles TO anon, authenticated, service_role;

-- =============================================================================
-- 7. PROFILES SECURITY (STRICT OWNER-ONLY SELECT ON TABLES, SAFE PUBLIC VIEWS)
-- =============================================================================

CREATE POLICY "profiles_select_owner" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin_user(auth.uid()));

CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 8. POSTS & STORIES SECURITY
-- =============================================================================

CREATE POLICY "posts_select_public" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_owner" ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "posts_update_owner" ON public.posts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete_owner" ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "stories_select_public" ON public.stories FOR SELECT USING (true);
CREATE POLICY "stories_insert_owner" ON public.stories FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "stories_update_owner" ON public.stories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stories_delete_owner" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 9. SOCIAL INTERACTIONS (COMMENTS, LIKES, SAVES, FOLLOWS)
-- =============================================================================

CREATE POLICY "comments_select_public" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_owner" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "comments_update_owner" ON public.comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_owner" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "likes_select_public" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_owner" ON public.likes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "likes_delete_owner" ON public.likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "saves_select_owner" ON public.saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saves_insert_owner" ON public.saves FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "saves_delete_owner" ON public.saves FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "follows_select_public" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_owner" ON public.follows FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = follower_id);
CREATE POLICY "follows_delete_owner" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- =============================================================================
-- 10. NOTIFICATIONS SECURITY (DISABLE CLIENT INSERT FORGERY)
-- =============================================================================

CREATE POLICY "notifications_select_owner" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_owner" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_owner" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 11. MESSAGING SECURITY (NON-RECURSIVE HELPER FUNCTION)
-- =============================================================================

CREATE POLICY "conv_select_policy" ON public.conversations FOR SELECT USING (
  public.is_conversation_member(id, auth.uid())
);
CREATE POLICY "conv_insert_policy" ON public.conversations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "cm_select_policy" ON public.conversation_members FOR SELECT USING (
  public.is_conversation_member(conversation_id, auth.uid())
);

CREATE POLICY "cm_insert_policy" ON public.conversation_members FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    user_id = auth.uid() OR public.is_conversation_member(conversation_id, auth.uid())
  )
);

CREATE POLICY "msg_select_policy" ON public.messages FOR SELECT USING (
  public.is_conversation_member(conversation_id, auth.uid())
);

CREATE POLICY "msg_insert_policy" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND public.is_conversation_member(conversation_id, auth.uid())
);

-- =============================================================================
-- 12. MARKETPLACE & PAYMENTS SECURITY
-- =============================================================================

-- Marketplace Products
CREATE POLICY "products_select_public" ON public.marketplace_products FOR SELECT USING (true);
CREATE POLICY "products_insert_seller" ON public.marketplace_products FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = seller_id);
CREATE POLICY "products_update_seller" ON public.marketplace_products FOR UPDATE USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_delete_seller" ON public.marketplace_products FOR DELETE USING (auth.uid() = seller_id);

-- Sellers Profile (TRIGGER-PROTECTED STATUS TAMPERING)
CREATE POLICY "sellers_select_public" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "sellers_insert_owner" ON public.sellers FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = user_id AND status = 'pending'
);
CREATE POLICY "sellers_update_owner" ON public.sellers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "sellers_admin_manage" ON public.sellers FOR ALL USING (
  public.is_admin_user(auth.uid())
) WITH CHECK (
  public.is_admin_user(auth.uid())
);

-- Marketplace Orders (NON-CIRCULAR PII SCOPING)
CREATE POLICY "orders_select_buyer_seller" ON public.marketplace_orders FOR SELECT USING (
  auth.uid() = buyer_id OR public.is_order_seller(id, auth.uid())
);
CREATE POLICY "orders_insert_buyer" ON public.marketplace_orders FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = buyer_id
);

-- Marketplace Order Items
CREATE POLICY "order_items_select_authorized" ON public.marketplace_order_items FOR SELECT USING (
  auth.uid() = seller_id OR
  EXISTS (SELECT 1 FROM public.marketplace_orders mo WHERE mo.id = order_id AND mo.buyer_id = auth.uid())
);
CREATE POLICY "order_items_insert_buyer" ON public.marketplace_order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.marketplace_orders mo WHERE mo.id = order_id AND mo.buyer_id = auth.uid())
);

-- Payments (CRITICAL: ZERO UPDATE FOR NORMAL USERS)
CREATE POLICY "payments_select_owner" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_owner" ON public.payments FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = user_id AND status = 'pending'
);

-- =============================================================================
-- 13. COURSES, HERITAGE, DISCUSSIONS, KNOWLEDGE, VERIFICATION, EVENTS, LIBRARY
-- =============================================================================

CREATE POLICY "courses_select_public" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_admin_manage" ON public.courses FOR ALL USING (public.is_admin_user(auth.uid())) WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "enrollments_select_owner" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "enrollments_insert_owner" ON public.enrollments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "enrollments_update_owner" ON public.enrollments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "heritage_recordings_select_public" ON public.heritage_recordings FOR SELECT USING (true);
CREATE POLICY "heritage_recordings_insert_owner" ON public.heritage_recordings FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "heritage_recordings_update_owner" ON public.heritage_recordings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "heritage_recordings_delete_owner" ON public.heritage_recordings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "heritage_saves_select_owner" ON public.heritage_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "heritage_saves_insert_owner" ON public.heritage_saves FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "heritage_saves_delete_owner" ON public.heritage_saves FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "discussion_topics_select_public" ON public.discussion_topics FOR SELECT USING (true);
CREATE POLICY "discussion_topics_insert_owner" ON public.discussion_topics FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "discussion_topics_update_owner" ON public.discussion_topics FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discussion_topics_delete_owner" ON public.discussion_topics FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "discussion_replies_select_public" ON public.discussion_replies FOR SELECT USING (true);
CREATE POLICY "discussion_replies_insert_owner" ON public.discussion_replies FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);
CREATE POLICY "discussion_replies_delete_owner" ON public.discussion_replies FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "discussion_votes_select_owner" ON public.discussion_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "discussion_votes_insert_owner" ON public.discussion_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "discussion_votes_update_owner" ON public.discussion_votes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discussion_votes_delete_owner" ON public.discussion_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "discussion_saves_select_owner" ON public.discussion_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "discussion_saves_insert_owner" ON public.discussion_saves FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "discussion_saves_delete_owner" ON public.discussion_saves FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "cultural_knowledge_select_public" ON public.cultural_knowledge FOR SELECT USING (true);
CREATE POLICY "cultural_knowledge_admin_manage" ON public.cultural_knowledge FOR ALL USING (public.is_admin_user(auth.uid())) WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "verification_select_owner_admin" ON public.verification_applications FOR SELECT USING (auth.uid() = user_id OR public.is_admin_user(auth.uid()));
CREATE POLICY "verification_insert_owner" ON public.verification_applications FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id AND status = 'pending');
CREATE POLICY "verification_admin_manage" ON public.verification_applications FOR ALL USING (public.is_admin_user(auth.uid())) WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "content_views_insert_public" ON public.content_views FOR INSERT WITH CHECK (true);
CREATE POLICY "library_items_select_public" ON public.library_items FOR SELECT USING (true);

CREATE POLICY "cultural_events_select_public" ON public.cultural_events FOR SELECT USING (true);
CREATE POLICY "cultural_events_insert_owner" ON public.cultural_events FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "cultural_events_update_owner" ON public.cultural_events FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cultural_events_delete_owner" ON public.cultural_events FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "event_registrations_select_owner" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "event_registrations_insert_owner" ON public.event_registrations FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "event_registrations_delete_owner" ON public.event_registrations FOR DELETE USING (auth.uid() = user_id);

COMMIT;
