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
  type: 'video' | 'article' | 'audio' | 'book' | 'image';
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
  type?: 'video' | 'image' | 'audio' | 'book' | 'article';
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
