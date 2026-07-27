import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Heart, MessageCircle, Share2, Bookmark,
  Play, Pause, CheckCircle, Loader2, Send, Eye, Clock, MapPin, Tag, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToggleLike, useToggleSave, useComments, useAddComment, useUserLikes, useUserSaves } from '@/hooks/usePosts';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PostAuthor {
  id: string;
  username: string | null;
  email?: string;
  avatar_url: string | null;
  verified: boolean;
  verified_type?: string | null;
  role?: string;
  bio?: string | null;
  followers_count?: number;
}

interface Post {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  media_url: string | null;
  duration: string | null;
  category: string;
  region: string | null;
  tags: string[];
  views: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  published: boolean;
  created_at: string;
  updated_at: string;
  author: PostAuthor;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function usePost(postId: string | undefined) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async (): Promise<Post | null> => {
      if (!postId) return null;
      const { data, error } = await supabase
        .from('posts')
        .select(`*, author:user_profiles!posts_user_id_fkey(id, username, email, avatar_url, verified, verified_type, role, bio, followers_count)`)
        .eq('id', postId)
        .single();
      if (error) throw error;
      // Increment view count
      supabase.from('posts').update({ views: (data.views || 0) + 1 }).eq('id', postId);
      return data as Post;
    },
    enabled: !!postId,
    staleTime: 30000,
  });
}

const TYPE_ICONS: Record<string, string> = {
  video: '🎥', article: '📄', audio: '🎙️', book: '📚', image: '🖼️',
};

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuth } = useAuth();
  const { data: post, isLoading, error } = usePost(id);
  const { data: likedSet } = useUserLikes(user?.id);
  const { data: savedSet } = useUserSaves(user?.id);
  const { data: comments = [] } = useComments(id || '');
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const addComment = useAddComment();
  const [commentText, setCommentText] = useState('');
  const [mediaPlaying, setMediaPlaying] = useState(false);

  const isLiked = post ? (likedSet?.has(post.id) ?? false) : false;
  const isSaved = post ? (savedSet?.has(post.id) ?? false) : false;

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) { openAuth('login'); return; }
    action();
  };

  const handleLike = () => requireAuth(() => {
    if (!user || !post) return;
    toggleLike.mutate({ postId: post.id, userId: user.id, isLiked });
  });

  const handleSave = () => requireAuth(() => {
    if (!user || !post) return;
    toggleSave.mutate({ postId: post.id, userId: user.id, isSaved });
  });

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => toast.success('Link copied!')).catch(() => {});
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !commentText.trim()) return;
    addComment.mutate({ postId: post.id, userId: user.id, content: commentText });
    setCommentText('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={36} className="text-umurage-gold animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="font-cinzel text-umurage-gold text-2xl font-bold mb-3">Post Not Found</h2>
        <p className="text-umurage-muted text-sm mb-6">This post may have been removed or is no longer available.</p>
        <button onClick={() => navigate('/')} className="btn-gold px-8 py-3">Back to Home</button>
      </div>
    );
  }

  const authorName = post.author?.username || post.author?.email?.split('@')[0] || 'Unknown';
  const authorAvatar = post.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-umurage-muted hover:text-umurage-cream text-sm mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Back
      </button>

      {/* Main card */}
      <div className="umurage-card rounded-2xl overflow-hidden mb-6">
        {/* Author & meta */}
        <div className="flex items-start gap-3 p-6 pb-4">
          <div className="relative flex-shrink-0">
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-12 h-12 rounded-full object-cover border-2 border-umurage-border"
            />
            {post.author?.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-umurage-verified border-2 border-umurage-bg flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">✓</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-umurage-cream font-semibold">{authorName}</span>
              {post.author?.verified && (
                <CheckCircle size={15} className="text-umurage-verified flex-shrink-0" />
              )}
              {post.author?.verified_type && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-umurage-verified/15 text-umurage-verified border border-umurage-verified/25 font-semibold">
                  {post.author.verified_type}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-umurage-subtle text-xs flex items-center gap-1">
                <Clock size={11} /> {timeAgo(post.created_at)}
              </span>
              {post.region && (
                <span className="text-umurage-subtle text-xs flex items-center gap-1">
                  <MapPin size={11} /> {post.region}
                </span>
              )}
              <span className="text-umurage-subtle text-xs flex items-center gap-1">
                <Eye size={11} /> {(post.views || 0) + 1} views
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="type-badge">
              {TYPE_ICONS[post.type] || '📄'} {post.type}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="px-6 pb-4">
          <h1 className="font-cinzel text-umurage-cream text-2xl font-bold leading-snug mb-3">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2.5 py-1 rounded-full border border-umurage-gold/30 bg-umurage-gold/10 text-umurage-gold font-semibold">
              {post.category}
            </span>
          </div>
        </div>

        {/* Media */}
        {post.media_url && (
          <div className="px-6 mb-4">
            {post.type === 'video' && (
              <div className="rounded-xl overflow-hidden bg-black">
                <video
                  src={post.media_url}
                  poster={post.thumbnail_url || undefined}
                  controls
                  className="w-full max-h-96 object-contain"
                />
              </div>
            )}
            {post.type === 'audio' && (
              <div className="rounded-xl bg-umurage-surface border border-umurage-border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-umurage-gold/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎙️</span>
                  </div>
                  <div>
                    <p className="text-umurage-cream text-sm font-semibold">{post.title}</p>
                    <p className="text-umurage-subtle text-xs">Audio Recording</p>
                  </div>
                </div>
                <audio src={post.media_url} controls className="w-full" />
              </div>
            )}
            {post.type === 'image' && (
              <div className="rounded-xl overflow-hidden">
                <img src={post.media_url} alt={post.title} className="w-full object-cover max-h-96" />
              </div>
            )}
          </div>
        )}

        {/* Thumbnail (when no media or image type preview) */}
        {!post.media_url && post.thumbnail_url && (
          <div className="px-6 mb-4">
            <div className="rounded-xl overflow-hidden">
              <img src={post.thumbnail_url} alt={post.title} className="w-full object-cover max-h-80" />
            </div>
          </div>
        )}

        {/* Description */}
        {post.description && (
          <div className="px-6 pb-4">
            <p className="text-umurage-muted text-base leading-relaxed">{post.description}</p>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs text-umurage-gold/80 bg-umurage-gold/8 border border-umurage-gold/20 px-2.5 py-1 rounded-full"
                >
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-umurage-border/50">
          <div className="flex items-center gap-5">
            <button
              onClick={handleLike}
              disabled={toggleLike.isPending}
              className={`flex items-center gap-2 text-sm font-medium transition-all duration-150 hover:scale-105 ${isLiked ? 'text-red-400' : 'text-umurage-subtle hover:text-red-400'}`}
            >
              {toggleLike.isPending
                ? <Loader2 size={18} className="animate-spin" />
                : <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
              }
              <span>{post.likes_count}</span>
            </button>

            <button
              onClick={() => requireAuth(() => {})}
              className="flex items-center gap-2 text-sm text-umurage-subtle hover:text-umurage-gold transition-colors"
            >
              <MessageCircle size={18} />
              <span>{post.comments_count}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm text-umurage-subtle hover:text-umurage-gold transition-colors"
            >
              <Share2 size={18} />
              <span>{post.shares_count}</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={toggleSave.isPending}
            className={`flex items-center gap-2 text-sm transition-all duration-150 hover:scale-105 ${isSaved ? 'text-umurage-gold' : 'text-umurage-subtle hover:text-umurage-gold'}`}
          >
            {toggleSave.isPending
              ? <Loader2 size={18} className="animate-spin" />
              : <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
            }
            <span className="text-xs">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Author info card */}
      <div className="umurage-card rounded-2xl p-5 mb-6">
        <h3 className="text-umurage-muted text-xs font-semibold uppercase tracking-wider mb-4">About the Creator</h3>
        <div className="flex items-start gap-4">
          <img src={authorAvatar} alt={authorName} className="w-14 h-14 rounded-full object-cover border-2 border-umurage-border flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-umurage-cream font-semibold">{authorName}</span>
              {post.author?.verified && <CheckCircle size={15} className="text-umurage-verified" />}
            </div>
            {post.author?.bio && (
              <p className="text-umurage-muted text-sm mb-2 leading-relaxed">{post.author.bio}</p>
            )}
            <div className="flex items-center gap-4 text-umurage-subtle text-xs">
              <span>{post.author?.followers_count || 0} followers</span>
              {post.author?.role && (
                <span className="capitalize text-umurage-gold/70">{post.author.role}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(`/profile?user=${post.author.id}`)}
            className="btn-outline-gold text-xs px-4 py-2 flex-shrink-0"
          >
            View Profile
          </button>
        </div>
      </div>

      {/* Comments section */}
      <div className="umurage-card rounded-2xl p-6">
        <h3 className="text-umurage-cream font-semibold mb-5 flex items-center gap-2">
          <MessageCircle size={18} className="text-umurage-gold" />
          {post.comments_count} Comments
        </h3>

        {/* Add comment */}
        {isAuthenticated ? (
          <form onSubmit={handleComment} className="flex gap-3 mb-6">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
              alt={user?.name || 'You'}
              className="w-9 h-9 rounded-full object-cover border border-umurage-border flex-shrink-0"
            />
            <div className="flex-1 flex gap-2 bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 focus-within:border-umurage-gold/50 transition-colors">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Share your thoughts on this cultural content..."
                className="flex-1 bg-transparent text-umurage-cream text-sm placeholder-umurage-subtle focus:outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || addComment.isPending}
                className="text-umurage-gold disabled:opacity-40 hover:text-umurage-gold-light transition-colors flex-shrink-0"
              >
                {addComment.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-umurage-surface border border-umurage-border rounded-xl p-4 mb-6 text-center">
            <p className="text-umurage-muted text-sm mb-3">Sign in to join the cultural conversation</p>
            <button onClick={() => openAuth('login')} className="btn-gold px-6 py-2.5 text-sm">Sign In</button>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-4">
          {(comments as { id: string; author?: { avatar_url?: string | null; username?: string | null; email?: string }; content: string; created_at: string }[]).length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={32} className="text-umurage-gold/20 mx-auto mb-3" />
              <p className="text-umurage-muted text-sm">No comments yet. Start the cultural conversation!</p>
            </div>
          ) : (
            (comments as { id: string; author?: { avatar_url?: string | null; username?: string | null; email?: string }; content: string; created_at: string }[]).map(comment => {
              const cAuthor = comment.author;
              const cName = cAuthor?.username || cAuthor?.email?.split('@')[0] || 'User';
              return (
                <div key={comment.id} className="flex gap-3 animate-fade-in">
                  <img
                    src={cAuthor?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${cName}`}
                    alt={cName}
                    className="w-9 h-9 rounded-full object-cover border border-umurage-border flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-umurage-cream text-sm font-semibold">{cName}</span>
                        <span className="text-umurage-subtle text-xs">{timeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-umurage-muted text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
