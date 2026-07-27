import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Play, CheckCircle, Loader2, Send, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleLike, useToggleSave, useComments, useAddComment } from '@/hooks/usePosts';
import { useUserLikes, useUserSaves } from '@/hooks/usePosts';
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
  // mock compat
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
    <article className="umurage-card rounded-2xl overflow-hidden mb-4 animate-fade-in group cursor-pointer" onClick={handleCardClick}>
      {/* Author row */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="relative flex-shrink-0">
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover border-2 border-umurage-border"
            onClick={e => { e.stopPropagation(); navigate(`/profile?user=${item.author?.id}`); }}
          />
          {item.author?.verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-umurage-verified border border-umurage-bg flex items-center justify-center">
              <span className="text-white text-[7px] font-bold">✓</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-umurage-cream text-sm font-semibold hover:text-umurage-gold transition-colors cursor-pointer"
              onClick={e => { e.stopPropagation(); navigate(`/profile?user=${item.author?.id}`); }}
            >
              {authorName}
            </span>
            {item.author?.verified && <CheckCircle size={14} className="text-umurage-verified flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-umurage-subtle text-xs">{item.timeAgo || timeAgo(item.created_at)}</span>
            {item.region && (
              <>
                <span className="text-umurage-border text-xs">•</span>
                <span className="text-umurage-subtle text-xs">{item.region}</span>
              </>
            )}
          </div>
        </div>
        <span className={`type-badge ${typeBadgeClass}`}>{item.type}</span>
      </div>

      {/* Content */}
      <div className="flex gap-4 px-4 pb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-umurage-cream font-semibold text-base leading-snug mb-1.5 group-hover:text-umurage-gold transition-colors">
            {item.title}
          </h3>
          <p className="text-umurage-muted text-sm leading-relaxed line-clamp-2">{item.description}</p>
          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] text-umurage-gold/70 bg-umurage-gold/8 border border-umurage-gold/15 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {thumbnail && (
          <div className="relative flex-shrink-0 w-32 h-24 rounded-xl overflow-hidden">
            <img src={thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {(item.type === 'video' || item.type === 'audio') && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-umurage-gold/90 flex items-center justify-center">
                  <Play size={14} className="text-umurage-bg ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
            {item.duration && (
              <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                {item.duration}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-umurage-border/50" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={toggleLike.isPending}
            className={`flex items-center gap-1.5 text-sm transition-all duration-150 hover:scale-105 ${isLiked ? 'text-red-400' : 'text-umurage-subtle hover:text-red-400'}`}
          >
            {toggleLike.isPending ? <Loader2 size={15} className="animate-spin" /> : <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />}
            <span>{likesCount}</span>
          </button>
          <button
            onClick={handleCommentToggle}
            className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? 'text-umurage-gold' : 'text-umurage-subtle hover:text-umurage-gold'}`}
          >
            <MessageCircle size={16} />
            <span>{commentsCount}</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-umurage-subtle hover:text-umurage-gold transition-colors">
            <Share2 size={16} />
            <span>{sharesCount}</span>
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={toggleSave.isPending}
          className={`transition-all duration-150 hover:scale-105 ${isSaved ? 'text-umurage-gold' : 'text-umurage-subtle hover:text-umurage-gold'}`}
        >
          {toggleSave.isPending ? <Loader2 size={15} className="animate-spin" /> : <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />}
        </button>
      </div>

      {/* Comments panel */}
      {showComments && (
        <div className="border-t border-umurage-border/50 px-4 py-4 bg-umurage-surface/30 animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="space-y-3 mb-4 max-h-52 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-umurage-subtle text-xs text-center py-4">No comments yet. Be the first!</p>
            ) : (
              comments.map((c: { id: string; author?: { avatar_url?: string | null; username?: string | null; email?: string }; content: string; created_at: string }) => (
                <div key={c.id} className="flex gap-2.5">
                  <img
                    src={c.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.author?.username || 'U'}`}
                    alt={c.author?.username || 'User'}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-umurage-border"
                  />
                  <div className="flex-1">
                    <div className="bg-umurage-card rounded-xl px-3 py-2">
                      <span className="text-umurage-cream text-xs font-semibold">
                        {c.author?.username || c.author?.email?.split('@')[0] || 'User'}
                      </span>
                      <p className="text-umurage-muted text-xs mt-0.5 leading-relaxed">{c.content}</p>
                    </div>
                    <span className="text-umurage-subtle text-[10px] ml-2">{timeAgo(c.created_at)}</span>
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
                className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-umurage-border"
              />
              <div className="flex-1 flex gap-2 bg-umurage-card border border-umurage-border rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-transparent text-umurage-cream text-sm placeholder-umurage-subtle focus:outline-none"
                />
                <button type="submit" disabled={!commentText.trim() || addComment.isPending} className="text-umurage-gold disabled:opacity-40 hover:text-umurage-gold-light transition-colors">
                  {addComment.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => openAuth('login')} className="btn-outline-gold w-full text-xs py-2">Sign in to comment</button>
          )}
        </div>
      )}
    </article>
  );
};

export default ContentCard;
