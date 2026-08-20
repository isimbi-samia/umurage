import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Play, CheckCircle, Loader2, Send, Eye, Trash2, Radio } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleLike, useToggleSave, useComments, useAddComment, useTrackPostView, useDeletePost } from '@/hooks/usePosts';
import { useSharePostToStory } from '@/hooks/useStories';
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
  user_id?: string;
  type: 'video' | 'article' | 'audio' | 'book' | 'image' | 'story' | 'document';
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  media_url?: string | null;
  duration: string | null;
  category: string;
  region: string | null;
  tags?: string[];
  views: number;
  views_count?: number | null;
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
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ContentCard: React.FC<ContentCardProps> = ({ item, likedSet, savedSet }) => {
  const { user, isAuthenticated, openAuth } = useAuth();
  const navigate = useNavigate();
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const deletePost = useDeletePost();
  const sharePostToStory = useSharePostToStory();
  const trackPostView = useTrackPostView();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const addComment = useAddComment();
  const { data: comments = [] } = useComments(showComments ? item.id : '');

  const isOwner = !!(user?.id && (item.author?.id === user.id || item.user_id === user.id));
  const isLiked = likedSet ? likedSet.has(item.id) : (item.liked || false);
  const isSaved = savedSet ? savedSet.has(item.id) : (item.saved || false);
  const likesCount = item.likes_count ?? item.likes ?? 0;
  const commentsCount = item.comments_count ?? item.comments ?? 0;
  const sharesCount = item.shares_count ?? item.shares ?? 0;
  const viewsCount = (item as Post & { views_count?: number | null }).views_count ?? item.views ?? 0;

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

  const handleDeletePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      if (!user) return;
      if (window.confirm('Are you sure you want to delete this post?')) {
        deletePost.mutate({ postId: item.id, userId: user.id });
      }
    });
  };

  const handleShareToStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      if (!user) return;
      const mediaUrl = item.thumbnail_url || item.media_url || item.thumbnail;
      if (!mediaUrl) {
        toast.error('Post must have media or a thumbnail to share to story');
        return;
      }
      sharePostToStory.mutate({
        userId: user.id,
        postId: item.id,
        postTitle: item.title,
        mediaUrl,
        postType: item.type,
      });
    });
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

  useEffect(() => {
    if (hasTrackedView || !item.id) return;
    setHasTrackedView(true);
    trackPostView.mutate({ postId: item.id, userId: user?.id });
  }, [hasTrackedView, item.id, user?.id, trackPostView]);

  const authorName = item.author?.username || item.author?.email?.split('@')[0] || 'Contributor';
  const authorAvatar = item.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`;
  const thumbnail = item.thumbnail_url || item.thumbnail;

  const typeBadgeClass = {
    video: 'video', article: 'article', audio: 'audio', book: 'book', image: 'image', story: 'story', document: 'book',
  }[item.type] || 'article';

  return (
    <article className="animate-fade-in group cursor-pointer overflow-hidden rounded-xl border border-[#2d1e13] bg-[#160f09] mb-4 shadow-sm hover:border-[#3d2719] transition-all duration-150" onClick={handleCardClick}>
      {/* Author Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#24170d]">
        <div className="flex items-center gap-3">
          <img
            src={authorAvatar}
            alt={authorName}
            className="h-9 w-9 rounded-full border border-[#382415] object-cover"
            onClick={e => { e.stopPropagation(); if (item.author?.id) navigate(`/profile?user=${item.author.id}`); }}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-semibold text-[#f2e6d8] hover:text-[#d4a24c] transition-colors"
                onClick={e => { e.stopPropagation(); if (item.author?.id) navigate(`/profile?user=${item.author.id}`); }}
              >
                {authorName}
              </span>
              {item.author?.verified && <CheckCircle size={13} className="text-emerald-400" />}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#a89078]">
              <span>{item.timeAgo || timeAgo(item.created_at)}</span>
              {item.region && (
                <>
                  <span>·</span>
                  <span>{item.region}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={handleDeletePost}
              disabled={deletePost.isPending}
              className="p-1.5 text-[#a89078] hover:text-red-400 transition-colors rounded"
              title="Delete post"
            >
              {deletePost.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          )}
          <span className={`type-badge ${typeBadgeClass}`}>{item.type || 'article'}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        <h2 className="text-base font-semibold leading-snug text-[#f2e6d8] group-hover:text-[#d4a24c] transition-colors mb-1.5">
          {item.title}
        </h2>

        {item.description && (
          <p className="text-xs leading-relaxed text-[#b8a694] mb-3 line-clamp-3">
            {item.description}
          </p>
        )}

        {/* Media Preview */}
        {thumbnail && (
          <div className="relative mb-3 overflow-hidden rounded-lg border border-[#2d1e13] bg-[#0e0906]">
            <img src={thumbnail} alt={item.title} className="h-52 sm:h-64 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            {(item.type === 'video' || item.type === 'audio') && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c8960c] text-[#0e0906] shadow-md">
                  <Play size={18} className="ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
            {item.duration && (
              <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-mono text-white">
                {item.duration}
              </div>
            )}
          </div>
        )}

        {/* Metadata Badges */}
        <div className="flex items-center gap-3 text-[11px] text-[#a89078]">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {viewsCount.toLocaleString()} views
          </span>
          {item.category && (
            <span className="rounded bg-[#24170d] px-2 py-0.5 text-[10px] text-[#c2b29f]">
              {item.category}
            </span>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              {item.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] text-[#d4a24c]">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between border-t border-[#24170d] px-4 py-2.5 bg-[#140d08]/50" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-5">
          <button
            onClick={handleLike}
            disabled={toggleLike.isPending}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isLiked ? 'text-rose-400' : 'text-[#a89078] hover:text-rose-400'}`}
          >
            {toggleLike.isPending ? <Loader2 size={14} className="animate-spin" /> : <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />}
            <span>{likesCount}</span>
          </button>

          <button
            onClick={handleCommentToggle}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${showComments ? 'text-[#d4a24c]' : 'text-[#a89078] hover:text-[#d4a24c]'}`}
          >
            <MessageCircle size={15} />
            <span>{commentsCount}</span>
          </button>

          <button onClick={handleShare} className="flex items-center gap-1.5 text-xs font-medium text-[#a89078] hover:text-[#f2e6d8] transition-colors" title="Copy link to post">
            <Share2 size={15} />
            <span>{sharesCount}</span>
          </button>

          <button
            onClick={handleShareToStory}
            disabled={sharePostToStory.isPending}
            className="flex items-center gap-1.5 text-xs font-medium text-[#a89078] hover:text-[#d4a24c] transition-colors"
            title="Repost this to your 24h Story"
          >
            {sharePostToStory.isPending ? <Loader2 size={14} className="animate-spin" /> : <Radio size={15} />}
            <span>Story</span>
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={toggleSave.isPending}
          className={`transition-colors ${isSaved ? 'text-[#d4a24c]' : 'text-[#a89078] hover:text-[#d4a24c]'}`}
        >
          {toggleSave.isPending ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-[#24170d] bg-[#120c08] p-4" onClick={e => e.stopPropagation()}>
          <div className="mb-3 max-h-48 space-y-2.5 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="py-3 text-center text-xs text-[#a89078]">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((c: { id: string; author?: { avatar_url?: string | null; username?: string | null; email?: string }; content: string; created_at: string }) => (
                <div key={c.id} className="flex gap-2 text-xs">
                  <img
                    src={c.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.author?.username || 'U'}`}
                    alt={c.author?.username || 'User'}
                    className="h-6 w-6 flex-shrink-0 rounded-full border border-[#2d1e13] object-cover mt-0.5"
                  />
                  <div className="flex-1 rounded-lg bg-[#1a110a] p-2.5 border border-[#26180d]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#f2e6d8]">
                        {c.author?.username || c.author?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="text-[10px] text-[#7a6754]">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-[#c2b29f] leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {isAuthenticated ? (
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 rounded-lg border border-[#2d1e13] bg-[#1a110a] px-3 py-1.5 text-xs text-[#f2e6d8] placeholder-[#7a6754] focus:outline-none focus:border-[#c8960c]/60"
              />
              <button type="submit" disabled={!commentText.trim() || addComment.isPending} className="btn-gold py-1 px-3 text-xs">
                {addComment.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </form>
          ) : (
            <button onClick={() => openAuth('login')} className="btn-outline-gold w-full py-1.5 text-xs">Sign in to comment</button>
          )}
        </div>
      )}
    </article>
  );
};

export default ContentCard;