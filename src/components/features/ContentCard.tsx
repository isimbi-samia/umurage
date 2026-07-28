import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Play, CheckCircle, Loader2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleLike, useToggleSave, useComments, useAddComment } from '@/hooks/usePosts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PostAuthor {
  id: string;
  username: string | null;
  email?: string;
  avatar_url: string | null;
  verified: boolean;
  verified_type?: string | null;
  role?: string;
}

interface Post {
  id: string;
  type: 'video' | 'article' | 'audio' | 'book' | 'image';
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  media_url?: string | null;
  duration: string | null;
  category: string;
  region: string | null;
  tags?: string[];
  views: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  author: PostAuthor;
  likes?: number;
  comments?: number;
  shares?: number;
  thumbnail?: string;
  timeAgo?: string;
  saved?: boolean;
  liked?: boolean;
}

interface ContentCardProps {
  item: Post;
  likedSet?: Set<string>;
  savedSet?: Set<string>;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const ContentCard: React.FC<ContentCardProps> = ({ item, likedSet, savedSet }) => {
  const { user, isAuthenticated, openAuth } = useAuth();
  const navigate = useNavigate();
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const addComment = useAddComment();
  const { data: comments = [] } = useComments(showComments ? item.id : '');

  const isLiked = likedSet ? likedSet.has(item.id) : (item.liked || false);
  const isSaved = savedSet ? savedSet.has(item.id) : (item.saved || false);
  const likesCount = item.likes_count ?? item.likes ?? 0;
  const commentsCount = item.comments_count ?? item.comments ?? 0;
  const sharesCount = item.shares_count ?? item.shares ?? 0;

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) { openAuth('login'); return; }
    action();
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      if (!user) return;
      toggleLike.mutate({ postId: item.id, userId: user.id, isLiked });
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      if (!user) return;
      toggleSave.mutate({ postId: item.id, userId: user.id, isSaved });
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${item.id}`;
    navigator.clipboard?.writeText(url).then(() => toast.success('Link copied!')).catch(() => toast.info('Share this post!'));
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !commentText.trim()) return;
    addComment.mutate({ postId: item.id, userId: user.id, content: commentText });
    setCommentText('');
  };

  const handleCardClick = () => {
    navigate(`/post/${item.id}`);
  };

  const handleCommentToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => setShowComments(!showComments));
  };

  const authorName = item.author?.username || item.author?.email?.split('@')[0] || 'Unknown';
  const authorAvatar = item.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`;
  const thumbnail = item.thumbnail_url || item.thumbnail;

  const typeBadgeClass = {
    video: 'video', article: 'article', audio: 'audio', book: 'book', image: 'image',
  }[item.type] || 'article';

  return (
    <article className="animate-fade-in group cursor-pointer overflow-hidden rounded-[24px] border border-amber-400/20 bg-[rgba(27,16,8,0.65)] shadow-[0_16px_40px_rgba(0,0,0,0.18)]" onClick={handleCardClick}>
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="relative flex-shrink-0">
          <img
            src={authorAvatar}
            alt={authorName}
            className="h-11 w-11 rounded-full border border-umurage-gold/25 object-cover"
            onClick={e => { e.stopPropagation(); navigate(`/profile?user=${item.author?.id}`); }}
          />
          {item.author?.verified && (
            <div className="absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-[#0f0905] bg-emerald-500">
              <span className="text-[7px] font-bold text-white">✓</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="cursor-pointer text-sm font-semibold text-umurage-gold-light transition-colors hover:text-umurage-gold"
              onClick={e => { e.stopPropagation(); navigate(`/profile?user=${item.author?.id}`); }}
            >
              {authorName}
            </span>
            {item.author?.verified && <CheckCircle size={14} className="flex-shrink-0 text-emerald-400" />}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-umurage-gold-light/60">{item.timeAgo || timeAgo(item.created_at)}</span>
            {item.region && (
              <>
                <span className="text-[11px] text-umurage-gold-light/35">·</span>
                <span className="text-xs text-umurage-gold-light/60">{item.region}</span>
              </>
            )}
          </div>
        </div>
        <span className={`type-badge ${typeBadgeClass}`}>{item.type.toUpperCase()}</span>
      </div>

      <div className="px-4 pb-3">
        {thumbnail && (
          <div className="relative mb-3 overflow-hidden rounded-[20px] border border-amber-400/20">
            <img src={thumbnail} alt={item.title} className="h-48 sm:h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {(item.type === 'video' || item.type === 'audio') && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-umurage-gold/90 shadow-[0_0_24px_rgba(212,162,76,0.35)]">
                  <Play size={18} className="ml-0.5 text-[#1b140f]" fill="currentColor" />
                </div>
              </div>
            )}
            {item.duration && (
              <div className="absolute bottom-2 right-2 rounded-full border border-umurage-gold/20 bg-black/70 px-2 py-1 text-[10px] font-mono text-umurage-gold-light">
                {item.duration}
              </div>
            )}
          </div>
        )}

        <div className="min-w-0">
          <h3 className="mb-2 text-base font-semibold leading-snug text-umurage-gold-light transition-colors group-hover:text-umurage-cream">
            {item.title}
          </h3>
          <p className="text-sm leading-relaxed text-umurage-gold-light/70">{item.description}</p>
          {item.tags && item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="rounded-full border border-umurage-gold/20 bg-umurage-gold/10 px-2.5 py-1 text-[10px] font-medium text-umurage-gold-light">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-amber-400/15 px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={toggleLike.isPending}
            className={`flex items-center gap-1.5 text-sm transition-all duration-150 hover:scale-105 ${isLiked ? 'text-rose-400' : 'text-umurage-gold-light/70 hover:text-rose-400'}`}
          >
            {toggleLike.isPending ? <Loader2 size={15} className="animate-spin" /> : <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />}
            <span>{likesCount}</span>
          </button>
          <button
            onClick={handleCommentToggle}
            className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? 'text-umurage-gold' : 'text-umurage-gold-light/70 hover:text-umurage-gold'}`}
          >
            <MessageCircle size={16} />
            <span>{commentsCount}</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-umurage-gold-light/70 transition-colors hover:text-umurage-gold">
            <Share2 size={16} />
            <span>{sharesCount}</span>
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={toggleSave.isPending}
          className={`transition-all duration-150 hover:scale-105 ${isSaved ? 'text-umurage-gold' : 'text-umurage-gold-light/70 hover:text-umurage-gold'}`}
        >
          {toggleSave.isPending ? <Loader2 size={15} className="animate-spin" /> : <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />}
        </button>
      </div>

      {showComments && (
        <div className="animate-fade-in border-t border-amber-400/15 bg-black/10 px-4 py-4" onClick={e => e.stopPropagation()}>
          <div className="mb-4 max-h-52 space-y-3 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="py-4 text-center text-xs text-umurage-gold-light/60">No comments yet. Be the first!</p>
            ) : (
              comments.map((c: { id: string; author?: { avatar_url?: string | null; username?: string | null; email?: string }; content: string; created_at: string }) => (
                <div key={c.id} className="flex gap-2.5">
                  <img
                    src={c.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.author?.username || 'U'}`}
                    alt={c.author?.username || 'User'}
                    className="h-7 w-7 flex-shrink-0 rounded-full border border-umurage-gold/20 object-cover"
                  />
                  <div className="flex-1">
                    <div className="rounded-xl bg-[#1d130d] px-3 py-2">
                      <span className="text-xs font-semibold text-umurage-gold-light">
                        {c.author?.username || c.author?.email?.split('@')[0] || 'User'}
                      </span>
                      <p className="mt-0.5 text-xs leading-relaxed text-umurage-gold-light/70">{c.content}</p>
                    </div>
                    <span className="ml-2 text-[10px] text-umurage-gold-light/50">{timeAgo(c.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          {isAuthenticated ? (
            <form onSubmit={handleComment} className="flex gap-2">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}`}
                alt={user?.name || 'You'}
                className="h-7 w-7 flex-shrink-0 rounded-full border border-umurage-gold/20 object-cover"
              />
              <div className="flex flex-1 gap-2 rounded-xl border border-umurage-gold/20 bg-[#1d130d] px-3 py-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-transparent text-sm text-umurage-gold-light placeholder-umurage-gold-light/40 focus:outline-none"
                />
                <button type="submit" disabled={!commentText.trim() || addComment.isPending} className="text-umurage-gold transition-colors hover:text-umurage-gold-light disabled:opacity-40">
                  {addComment.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => openAuth('login')} className="btn-outline-gold w-full py-2 text-xs">Sign in to comment</button>
          )}
        </div>
      )}
    </article>
  );
};

export default ContentCard;