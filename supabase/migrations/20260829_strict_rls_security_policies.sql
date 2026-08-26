-- Migration: 20260829_strict_rls_security_policies.sql
-- Purpose: Strict RLS Security Migration for Umurage Hub (Phase 3B Proposal)
-- IMPORTANT: PROPOSED MIGRATION — DO NOT EXECUTE UNTIL REVIEWED.

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
-- 2. PROFILES SECURITY
-- =============================================================================

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;

CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 3. POSTS SECURITY (REPLACE PERMISSIVE POLICIES WITH OWNER CHECKS)
-- =============================================================================

DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_all" ON public.posts;
DROP POLICY IF EXISTS "posts_update_all" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_all" ON public.posts;
DROP POLICY IF EXISTS "posts_select_public" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_auth" ON public.posts;
DROP POLICY IF EXISTS "posts_update_owner" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_owner" ON public.posts;

CREATE POLICY "posts_select_public" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "posts_insert_owner" ON public.posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "posts_update_owner" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete_owner" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 4. STORIES SECURITY (REPLACE PERMISSIVE POLICIES WITH OWNER CHECKS)
-- =============================================================================

DROP POLICY IF EXISTS "stories_select_all" ON public.stories;
DROP POLICY IF EXISTS "stories_insert_all" ON public.stories;
DROP POLICY IF EXISTS "stories_update_all" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_all" ON public.stories;

CREATE POLICY "stories_select_public" ON public.stories
  FOR SELECT USING (true);

CREATE POLICY "stories_insert_owner" ON public.stories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "stories_update_owner" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_delete_owner" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 5. SOCIAL INTERACTIONS (COMMENTS, LIKES, SAVES, FOLLOWS)
-- =============================================================================

-- Comments
DROP POLICY IF EXISTS "comments_select_public" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_owner" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_owner" ON public.comments;

CREATE POLICY "comments_select_public" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_owner" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "comments_update_owner" ON public.comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_owner" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Likes
DROP POLICY IF EXISTS "likes_select_public" ON public.likes;
DROP POLICY IF EXISTS "likes_insert_owner" ON public.likes;
DROP POLICY IF EXISTS "likes_delete_owner" ON public.likes;

CREATE POLICY "likes_select_public" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_owner" ON public.likes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "likes_delete_owner" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Saves (Private to User)
DROP POLICY IF EXISTS "saves_select_owner" ON public.saves;
DROP POLICY IF EXISTS "saves_insert_owner" ON public.saves;
DROP POLICY IF EXISTS "saves_delete_owner" ON public.saves;

CREATE POLICY "saves_select_owner" ON public.saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saves_insert_owner" ON public.saves FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "saves_delete_owner" ON public.saves FOR DELETE USING (auth.uid() = user_id);

-- Follows
DROP POLICY IF EXISTS "follows_select_public" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_owner" ON public.follows;
DROP POLICY IF EXISTS "follows_delete_owner" ON public.follows;

CREATE POLICY "follows_select_public" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_owner" ON public.follows FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = follower_id);
CREATE POLICY "follows_delete_owner" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- =============================================================================
-- 6. NOTIFICATIONS SECURITY
-- =============================================================================

DROP POLICY IF EXISTS "notifications_select_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_owner" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_owner" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_owner" ON public.notifications;

CREATE POLICY "notifications_select_owner" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_auth" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update_owner" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_owner" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 7. MESSAGING SECURITY (CONVERSATIONS, MEMBERS, MESSAGES)
-- =============================================================================

-- Conversations
DROP POLICY IF EXISTS "conv_select_policy" ON public.conversations;
CREATE POLICY "conv_select_policy" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "conv_insert_policy" ON public.conversations;
CREATE POLICY "conv_insert_policy" ON public.conversations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Conversation Members
DROP POLICY IF EXISTS "cm_select_policy" ON public.conversation_members;
DROP POLICY IF EXISTS "cm_insert_policy" ON public.conversation_members;

CREATE POLICY "cm_select_policy" ON public.conversation_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "cm_insert_policy" ON public.conversation_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()
      )
    )
  );

-- Messages
DROP POLICY IF EXISTS "msg_select_policy" ON public.messages;
DROP POLICY IF EXISTS "msg_insert_policy" ON public.messages;

CREATE POLICY "msg_select_policy" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "msg_insert_policy" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- =============================================================================
-- 8. MARKETPLACE & PAYMENTS SECURITY
-- =============================================================================

-- Marketplace Products
DROP POLICY IF EXISTS "products_select_public" ON public.marketplace_products;
DROP POLICY IF EXISTS "products_insert_seller" ON public.marketplace_products;
DROP POLICY IF EXISTS "products_update_seller" ON public.marketplace_products;
DROP POLICY IF EXISTS "products_delete_seller" ON public.marketplace_products;

CREATE POLICY "products_select_public" ON public.marketplace_products FOR SELECT USING (true);
CREATE POLICY "products_insert_seller" ON public.marketplace_products FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = seller_id);
CREATE POLICY "products_update_seller" ON public.marketplace_products FOR UPDATE USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_delete_seller" ON public.marketplace_products FOR DELETE USING (auth.uid() = seller_id);

-- Sellers Profile
DROP POLICY IF EXISTS "sellers_select_public" ON public.sellers;
DROP POLICY IF EXISTS "sellers_insert_owner" ON public.sellers;
DROP POLICY IF EXISTS "sellers_update_owner" ON public.sellers;

CREATE POLICY "sellers_select_public" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "sellers_insert_owner" ON public.sellers FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id AND status = 'pending');
CREATE POLICY "sellers_update_owner" ON public.sellers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND status = status);

-- Marketplace Orders (Sensitive PII Scoped to Buyer and Product Seller)
DROP POLICY IF EXISTS "orders_select_buyer_seller" ON public.marketplace_orders;
DROP POLICY IF EXISTS "orders_insert_buyer" ON public.marketplace_orders;

CREATE POLICY "orders_select_buyer_seller" ON public.marketplace_orders
  FOR SELECT USING (
    auth.uid() = buyer_id OR
    EXISTS (
      SELECT 1 FROM public.marketplace_order_items moi
      WHERE moi.order_id = marketplace_orders.id AND moi.seller_id = auth.uid()
    )
  );

CREATE POLICY "orders_insert_buyer" ON public.marketplace_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = buyer_id);

-- Marketplace Order Items
DROP POLICY IF EXISTS "order_items_select_authorized" ON public.marketplace_order_items;
DROP POLICY IF EXISTS "order_items_insert_buyer" ON public.marketplace_order_items;

CREATE POLICY "order_items_select_authorized" ON public.marketplace_order_items
  FOR SELECT USING (
    auth.uid() = seller_id OR
    EXISTS (
      SELECT 1 FROM public.marketplace_orders mo
      WHERE mo.id = order_id AND mo.buyer_id = auth.uid()
    )
  );

CREATE POLICY "order_items_insert_buyer" ON public.marketplace_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders mo
      WHERE mo.id = order_id AND mo.buyer_id = auth.uid()
    )
  );

-- Payments Infrastructure Log Table (CRITICAL: ZERO UPDATE FOR NORMAL USERS)
DROP POLICY IF EXISTS "payments_select_owner" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_owner" ON public.payments;

CREATE POLICY "payments_select_owner" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payments_insert_owner" ON public.payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id AND status = 'pending');
-- Intentionally NO UPDATE policy for normal authenticated users! Payment status changes require trusted server/service-role.

-- =============================================================================
-- 9. COURSES & ENROLLMENTS SECURITY
-- =============================================================================

-- Courses Catalog
DROP POLICY IF EXISTS "courses_select_public" ON public.courses;
CREATE POLICY "courses_select_public" ON public.courses FOR SELECT USING (true);

CREATE POLICY "courses_admin_manage" ON public.courses
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Enrollments
DROP POLICY IF EXISTS "enrollments_select_owner" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert_owner" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_update_owner" ON public.enrollments;

CREATE POLICY "enrollments_select_owner" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "enrollments_insert_owner" ON public.enrollments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "enrollments_update_owner" ON public.enrollments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 10. HERITAGE ARCHIVE & SAVES SECURITY
-- =============================================================================

-- Heritage Recordings
DROP POLICY IF EXISTS "heritage_recordings_select_public" ON public.heritage_recordings;
DROP POLICY IF EXISTS "heritage_recordings_insert_owner" ON public.heritage_recordings;
DROP POLICY IF EXISTS "heritage_recordings_update_owner" ON public.heritage_recordings;
DROP POLICY IF EXISTS "heritage_recordings_delete_owner" ON public.heritage_recordings;

CREATE POLICY "heritage_recordings_select_public" ON public.heritage_recordings FOR SELECT USING (true);
CREATE POLICY "heritage_recordings_insert_owner" ON public.heritage_recordings FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "heritage_recordings_update_owner" ON public.heritage_recordings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "heritage_recordings_delete_owner" ON public.heritage_recordings FOR DELETE USING (auth.uid() = user_id);

-- Heritage Saves
DROP POLICY IF EXISTS "heritage_saves_select_owner" ON public.heritage_saves;
DROP POLICY IF EXISTS "heritage_saves_insert_owner" ON public.heritage_saves;
DROP POLICY IF EXISTS "heritage_saves_delete_owner" ON public.heritage_saves;

CREATE POLICY "heritage_saves_select_owner" ON public.heritage_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "heritage_saves_insert_owner" ON public.heritage_saves FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "heritage_saves_delete_owner" ON public.heritage_saves FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 11. DISCUSSION FORUM SECURITY
-- =============================================================================

-- Discussion Topics
DROP POLICY IF EXISTS "discussion_topics_select_public" ON public.discussion_topics;
DROP POLICY IF EXISTS "discussion_topics_insert_owner" ON public.discussion_topics;
DROP POLICY IF EXISTS "discussion_topics_update_owner" ON public.discussion_topics;
DROP POLICY IF EXISTS "discussion_topics_delete_owner" ON public.discussion_topics;

CREATE POLICY "discussion_topics_select_public" ON public.discussion_topics FOR SELECT USING (true);
CREATE POLICY "discussion_topics_insert_owner" ON public.discussion_topics FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "discussion_topics_update_owner" ON public.discussion_topics FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discussion_topics_delete_owner" ON public.discussion_topics FOR DELETE USING (auth.uid() = user_id);

-- Discussion Replies
DROP POLICY IF EXISTS "discussion_replies_select_public" ON public.discussion_replies;
DROP POLICY IF EXISTS "discussion_replies_insert_owner" ON public.discussion_replies;
DROP POLICY IF EXISTS "discussion_replies_delete_owner" ON public.discussion_replies;

CREATE POLICY "discussion_replies_select_public" ON public.discussion_replies FOR SELECT USING (true);
CREATE POLICY "discussion_replies_insert_owner" ON public.discussion_replies FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);
CREATE POLICY "discussion_replies_delete_owner" ON public.discussion_replies FOR DELETE USING (auth.uid() = author_id);

-- Discussion Votes
DROP POLICY IF EXISTS "discussion_votes_select_owner" ON public.discussion_votes;
DROP POLICY IF EXISTS "discussion_votes_insert_owner" ON public.discussion_votes;
DROP POLICY IF EXISTS "discussion_votes_update_owner" ON public.discussion_votes;
DROP POLICY IF EXISTS "discussion_votes_delete_owner" ON public.discussion_votes;

CREATE POLICY "discussion_votes_select_owner" ON public.discussion_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "discussion_votes_insert_owner" ON public.discussion_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "discussion_votes_update_owner" ON public.discussion_votes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discussion_votes_delete_owner" ON public.discussion_votes FOR DELETE USING (auth.uid() = user_id);

-- Discussion Saves
DROP POLICY IF EXISTS "discussion_saves_select_owner" ON public.discussion_saves;
DROP POLICY IF EXISTS "discussion_saves_insert_owner" ON public.discussion_saves;
DROP POLICY IF EXISTS "discussion_saves_delete_owner" ON public.discussion_saves;

CREATE POLICY "discussion_saves_select_owner" ON public.discussion_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "discussion_saves_insert_owner" ON public.discussion_saves FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "discussion_saves_delete_owner" ON public.discussion_saves FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 12. CULTURAL KNOWLEDGE BASE SECURITY
-- =============================================================================

DROP POLICY IF EXISTS "cultural_knowledge_select_public" ON public.cultural_knowledge;
DROP POLICY IF EXISTS "cultural_knowledge_admin_manage" ON public.cultural_knowledge;

CREATE POLICY "cultural_knowledge_select_public" ON public.cultural_knowledge FOR SELECT USING (true);
CREATE POLICY "cultural_knowledge_admin_manage" ON public.cultural_knowledge
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- =============================================================================
-- 13. VERIFICATION APPLICATIONS SECURITY (PREVENT SELF-APPROVAL)
-- =============================================================================

DROP POLICY IF EXISTS "verification_select_owner_admin" ON public.verification_applications;
DROP POLICY IF EXISTS "verification_insert_owner" ON public.verification_applications;
DROP POLICY IF EXISTS "verification_admin_manage" ON public.verification_applications;

CREATE POLICY "verification_select_owner_admin" ON public.verification_applications
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "verification_insert_owner" ON public.verification_applications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id AND status = 'pending');

CREATE POLICY "verification_admin_manage" ON public.verification_applications
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- =============================================================================
-- 14. CONTENT VIEWS & LIBRARY ITEMS SECURITY
-- =============================================================================

DROP POLICY IF EXISTS "content_views_insert_public" ON public.content_views;
CREATE POLICY "content_views_insert_public" ON public.content_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "library_items_select_public" ON public.library_items;
CREATE POLICY "library_items_select_public" ON public.library_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "cultural_events_select_public" ON public.cultural_events;
DROP POLICY IF EXISTS "cultural_events_insert_owner" ON public.cultural_events;
DROP POLICY IF EXISTS "cultural_events_update_owner" ON public.cultural_events;
DROP POLICY IF EXISTS "cultural_events_delete_owner" ON public.cultural_events;

CREATE POLICY "cultural_events_select_public" ON public.cultural_events FOR SELECT USING (true);
CREATE POLICY "cultural_events_insert_owner" ON public.cultural_events FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "cultural_events_update_owner" ON public.cultural_events FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cultural_events_delete_owner" ON public.cultural_events FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "event_registrations_select_owner" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_insert_owner" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_delete_owner" ON public.event_registrations;

CREATE POLICY "event_registrations_select_owner" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "event_registrations_insert_owner" ON public.event_registrations FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "event_registrations_delete_owner" ON public.event_registrations FOR DELETE USING (auth.uid() = user_id);
