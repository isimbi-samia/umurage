-- Migration: 20260827_umurage_hub_comprehensive_schema.sql
-- Complete functional schema update for Umurage Hub
-- Adds missing tables, storage buckets, RLS policies, indexes, and initial verified cultural seed data.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. CULTURAL PLACES & SOURCES (Map Data Architecture)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cultural_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  province text NOT NULL,
  district text NOT NULL,
  sector text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  description text NOT NULL,
  cultural_significance text NOT NULL,
  historical_context text,
  sources text,
  image text,
  category text DEFAULT 'Heritage Site',
  verification_status text DEFAULT 'verified',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cultural_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read cultural_places" ON public.cultural_places;
CREATE POLICY "Public read cultural_places" ON public.cultural_places FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users edit cultural_places" ON public.cultural_places;
CREATE POLICY "Auth users edit cultural_places" ON public.cultural_places
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- 2. MARKETPLACE ARCHITECTURE (Sellers, Products, Orders, Payments, Payouts)
-- -----------------------------------------------------------------------------
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
  status text DEFAULT 'approved',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved sellers" ON public.sellers;
CREATE POLICY "Public read approved sellers" ON public.sellers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Sellers manage own profile" ON public.sellers;
CREATE POLICY "Sellers manage own profile" ON public.sellers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Ensure marketplace_products references seller user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marketplace_products' AND column_name='seller_id') THEN
    ALTER TABLE public.marketplace_products ADD COLUMN seller_id uuid REFERENCES public.profiles(id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  delivery_address text NOT NULL,
  district text NOT NULL,
  city text NOT NULL,
  delivery_instructions text,
  total_amount numeric NOT NULL,
  currency text DEFAULT 'RWF',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers view own orders" ON public.marketplace_orders;
CREATE POLICY "Buyers view own orders" ON public.marketplace_orders FOR SELECT USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Buyers insert own orders" ON public.marketplace_orders;
CREATE POLICY "Buyers insert own orders" ON public.marketplace_orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.profiles(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order items visible to order buyer or seller" ON public.marketplace_order_items;
CREATE POLICY "Order items visible to order buyer or seller" ON public.marketplace_order_items
  FOR SELECT USING (
    auth.uid() = seller_id OR
    EXISTS (SELECT 1 FROM public.marketplace_orders WHERE id = order_id AND buyer_id = auth.uid())
  );

DROP POLICY IF EXISTS "Buyers insert order items" ON public.marketplace_order_items;
CREATE POLICY "Buyers insert order items" ON public.marketplace_order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.marketplace_orders WHERE id = order_id AND buyer_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'RWF',
  status text DEFAULT 'pending', -- pending, completed, failed
  payment_method text DEFAULT 'MTN Mobile Money',
  provider text DEFAULT 'paypack',
  transaction_ref text UNIQUE DEFAULT gen_random_uuid()::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own payments" ON public.payments;
CREATE POLICY "Users create own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.seller_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.marketplace_orders(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'RWF',
  status text DEFAULT 'pending',
  payout_method text DEFAULT 'Mobile Money',
  transaction_ref text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers view own payouts" ON public.seller_payouts;
CREATE POLICY "Sellers view own payouts" ON public.seller_payouts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 3. COURSES & QUIZZES ECOSYSTEM
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  description text NOT NULL,
  category text DEFAULT 'Heritage',
  level text DEFAULT 'beginner',
  duration text DEFAULT '4 weeks',
  instructor_name text DEFAULT 'Umurage Master Elder',
  instructor_id uuid REFERENCES public.profiles(id),
  xp integer DEFAULT 500,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read courses" ON public.courses;
CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_order integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  description text,
  content text NOT NULL,
  media_url text,
  media_type text DEFAULT 'text',
  duration text DEFAULT '15 mins',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read course_lessons" ON public.course_lessons;
CREATE POLICY "Public read course_lessons" ON public.course_lessons FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  passing_score integer DEFAULT 70,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read course_quizzes" ON public.course_quizzes;
CREATE POLICY "Public read course_quizzes" ON public.course_quizzes FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.course_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  explanation text,
  question_order integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.course_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read course_questions" ON public.course_questions;
CREATE POLICY "Public read course_questions" ON public.course_questions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.course_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.course_questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  is_correct boolean DEFAULT false
);

ALTER TABLE public.course_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read course_answers" ON public.course_answers;
CREATE POLICY "Public read course_answers" ON public.course_answers FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL,
  passed boolean DEFAULT false,
  attempted_at timestamptz DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Users manage own quiz_attempts" ON public.quiz_attempts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. STANDALONE CULTURAL CHALLENGES / GAMES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text DEFAULT 'History',
  language text DEFAULT 'en',
  difficulty text DEFAULT 'medium',
  challenge_type text DEFAULT 'multiple_choice',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read challenges" ON public.challenges;
CREATE POLICY "Public read challenges" ON public.challenges FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.challenge_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL, -- 'A', 'B', 'C', 'D'
  explanation text NOT NULL,
  image_url text
);

ALTER TABLE public.challenge_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read challenge_questions" ON public.challenge_questions;
CREATE POLICY "Public read challenge_questions" ON public.challenge_questions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  language text DEFAULT 'en',
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE public.challenge_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own challenge_attempts" ON public.challenge_attempts;
CREATE POLICY "Users manage own challenge_attempts" ON public.challenge_attempts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. MY HERITAGE PRIVATE VAULT & SAVES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.heritage_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL, -- 'story', 'post', 'library', 'audio', 'place', 'discussion'
  item_id text NOT NULL,
  item_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE public.heritage_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own heritage_saves" ON public.heritage_saves;
CREATE POLICY "Users manage own heritage_saves" ON public.heritage_saves
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.discussion_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.discussion_topics(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE public.discussion_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own discussion_saves" ON public.discussion_saves;
CREATE POLICY "Users manage own discussion_saves" ON public.discussion_saves
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. AI CULTURAL GUIDE KNOWLEDGE BASE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cultural_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  language text DEFAULT 'en',
  topic text NOT NULL,
  content text NOT NULL,
  summary text,
  source_name text DEFAULT 'Rwanda Cultural Heritage Academy',
  source_url text,
  verification_status text DEFAULT 'verified',
  reviewer_name text DEFAULT 'Umurage Cultural Panel',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cultural_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read cultural_knowledge" ON public.cultural_knowledge;
CREATE POLICY "Public read cultural_knowledge" ON public.cultural_knowledge FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- 7. INITIAL SEED DATA FOR CULTURAL PLACES & KNOWLEDGE
-- -----------------------------------------------------------------------------
INSERT INTO public.cultural_places (name, slug, province, district, sector, latitude, longitude, description, cultural_significance, historical_context, sources, category, verification_status)
VALUES
  (
    'King''s Palace Museum — Nyanza',
    'kings-palace-nyanza',
    'Southern Province',
    'Nyanza',
    'Busasamana',
    -2.3524,
    29.7508,
    'The traditional royal residence of King Mutara III Rudahigwa, reconstructed to showcase ancient Rwandan royal architecture, sacred Inyambo cattle, and court customs.',
    'Nyanza was the capital of the Kingdom of Rwanda during the 19th and 20th centuries, preserving royal traditions and the sacred Inyambo long-horned cattle.',
    'Served as the heart of Rwandan monarchy prior to the mid-20th century.',
    'Institute of National Museums of Rwanda (INMR) & Rwanda Cultural Heritage Academy (RCHA)',
    'Museum',
    'verified'
  ),
  (
    'Ethnographic Museum — Huye',
    'ethnographic-museum-huye',
    'Southern Province',
    'Huye',
    'Ngoma',
    -2.5967,
    29.7397,
    'Gifted by Belgium in 1989, this museum holds one of Central Africa''s finest ethnographic collections covering traditional agriculture, weaving, pottery, woodwork, and regal attire.',
    'Displays over 10,000 authentic artifacts illustrating centuries of Rwandan social organization, crafts, and daily life.',
    'Opened in 1989 as the National Museum of Rwanda.',
    'Rwanda Cultural Heritage Academy (RCHA)',
    'Museum',
    'verified'
  ),
  (
    'National Liberation Park Museum — Mulindi',
    'national-liberation-park-mulindi',
    'Northern Province',
    'Gicumbi',
    'Kaniga',
    -1.4782,
    30.0125,
    'Historical site marking the headquarters of the Rwandan Patriotic Front (RPF) during the 1990-1994 struggle, preserving bunkers and strategic heritage.',
    'Key milestone in modern Rwandan history and national unity.',
    'Served as the operational base for liberation forces led by Chairman Paul Kagame.',
    'Ministry of Youth and Arts & National Museums',
    'Historical Monument',
    'verified'
  ),
  (
    'Rwanda Art Museum — Kanombe',
    'rwanda-art-museum-kanombe',
    'Kigali City',
    'Kicukiro',
    'Kanombe',
    -1.9647,
    30.1583,
    'Housed in the former Presidential Palace, displaying modern Rwandan contemporary paintings, sculptures, and Imigongo visual arts.',
    'Promotes contemporary Made-in-Rwanda art alongside historical residence heritage.',
    'Converted into the Rwanda Art Museum in 2018.',
    'Rwanda Art Museum Council',
    'Art Gallery',
    'verified'
  ),
  (
    'Musanze Caves & Buhanga Eco-Park',
    'musanze-caves-buhanga',
    'Northern Province',
    'Musanze',
    'Muhoza',
    -1.4989,
    29.6331,
    'Ancient volcanic caves used historically as royal coronation grounds and shelters during tribal wars.',
    'Buhanga Eco-Park was the sacred forest where Kings of Rwanda (Abami) underwent coronation rituals (Ikuzo ryo kwimikwa).',
    'Centuries of royal ritual traditions recorded in oral histories.',
    'Rwanda Development Board (RDB) Cultural Conservation',
    'Natural & Sacred Site',
    'verified'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cultural_knowledge (title, category, language, topic, content, summary, source_name)
VALUES
  (
    'Umuganura — The National Harvest Festival',
    'Traditions',
    'en',
    'umuganura',
    'Umuganura is one of Rwanda''s most vital traditional ceremonies, celebrated for over 1,800 years. Historically led by the King (Mwami) and elders, it expresses gratitude for the harvest, sorghum, cattle, and community unity. Today, it is celebrated annually on the first Friday of August as a national holiday promoting agricultural prosperity and national self-reliance (Kwigira).',
    'Traditional harvest festival celebrating community unity and gratitude.',
    'Rwanda Cultural Heritage Academy'
  ),
  (
    'Inyambo — Sacred Royal Cattle',
    'Heritage',
    'en',
    'inyambo',
    'Inyambo are a magnificent breed of long-horned cattle reserved exclusively for the Royal Court of Rwanda. Trained to march gracefully during royal ceremonies (Amasunzu and Intore parades), their horns can reach over two meters. They symbolize wealth, beauty, dignity, and harmony between humans and nature in traditional Rwandan pastoral culture.',
    'Sacred royal cattle famed for their majestic horns and ceremonial steps.',
    'Institute of National Museums of Rwanda'
  ),
  (
    'Intore — Dance of the Warriors',
    'Arts',
    'en',
    'intore',
    'Intore is Rwanda''s iconic traditional dance, originally performed by royal warriors who trained in martial arts, poetry, and leadership at the Itorero academy. Dancers wear grass wigs (Umugara), hold spears (Icumu) and shields (Ingabo), and leap rhythmically to the beat of drums (Ingoma) simulating heroic battle victory.',
    'Heroic warrior dance featuring drums, spears, and high rhythmic leaps.',
    'Rwanda Cultural Heritage Academy'
  ),
  (
    'Imigongo — Traditional Cow Dung Art',
    'Arts',
    'en',
    'imigongo',
    'Imigongo is a unique Rwandan art form originated in the 18th century by Prince Kakira of the Gisaka kingdom (Eastern Province). Created using cow dung mixed with ash and organic soils, artists carve geometric relief patterns colored with natural black, white, red, and mustard pigments.',
    'Traditional 18th-century geometric relief art made with organic materials.',
    'Nyamirambo Women''s Center & RCHA'
  )
ON CONFLICT DO NOTHING;
