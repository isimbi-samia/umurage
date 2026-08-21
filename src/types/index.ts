export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  role: 'user' | 'creator' | 'elder' | 'organization';
  verified: boolean;
  verifiedType?: string;
  followers: number;
  following: number;
  posts: number;
  location?: string;
  interests: string[];
  joinedAt: string;
}

export interface ContentItem {
  id: string;
  type: 'video' | 'article' | 'audio' | 'book' | 'image' | 'story' | 'document';
  title: string;
  description: string;
  author: User;
  thumbnail?: string;
  duration?: string;
  category: string;
  region: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  views?: string;
  saved?: boolean;
  liked?: boolean;
  createdAt: string;
  timeAgo: string;
}

export interface Story {
  id: string;
  user: User;
  hasNew: boolean;
  isAdd?: boolean;
  title?: string;
  description?: string;
  thumbnail?: string;
  type?: 'video' | 'image' | 'audio' | 'book' | 'article' | 'document';
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt?: string;
}

export interface TrendingItem {
  rank: number;
  title: string;
  views: string;
  thumbnail: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  image?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: number;
  duration: string;
  enrolled: number;
  thumbnail: string;
  instructor: string;
  category: string;
  xp: number;
  progress?: number;
}

export interface Language {
  code: string;
  label: string;
  native: string;
}

export type TabType = 'foryou' | 'following' | 'explore';

export interface CulturalPlace {
  id: string;
  name: string;
  slug?: string;
  province: string;
  district: string;
  sector?: string;
  latitude: number;
  longitude: number;
  description: string;
  cultural_significance: string;
  historical_context?: string;
  sources?: string;
  image?: string;
  category?: string;
  verification_status?: string;
  created_at?: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  business_name: string;
  phone: string;
  email: string;
  district: string;
  city: string;
  description?: string;
  payout_info?: string;
  status: string;
  created_at?: string;
}

export interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  image_url: string;
  seller_id?: string;
  is_featured?: boolean;
  stock_count?: number;
  rating?: number;
  review_count?: number;
  location?: string;
  delivery_info?: string;
  seller?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    verified: boolean | null;
  } | null;
  created_at?: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  image_url?: string;
}

export interface ChallengeItem {
  id: string;
  title: string;
  category: string;
  language: string;
  difficulty: string;
  challenge_type: string;
  questions?: QuizQuestion[];
}

export interface CulturalKnowledgeRecord {
  id: string;
  title: string;
  category: string;
  language: string;
  topic: string;
  content: string;
  summary?: string;
  source_name?: string;
  source_url?: string;
  verification_status?: string;
  reviewer_name?: string;
  created_at?: string;
}
