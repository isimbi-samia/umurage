import React, { useState } from 'react';
import {
  MessageSquare, Heart, Eye, PlusCircle, ChevronRight,
  Filter, ArrowUp, ArrowDown, Pin, Loader2, X, Send, ChevronLeft
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const CATEGORIES = ['All', 'History', 'Traditions', 'Language', 'Dance', 'Arts', 'Ceremonies', 'Education', 'Community', 'Nature'];

const CAT_COLORS: Record<string, string> = {
  'History': 'bg-amber-900/40 text-amber-300 border-amber-800/40',
  'Traditions': 'bg-umurage-gold/20 text-umurage-gold border-umurage-gold/20',
  'Language': 'bg-blue-900/40 text-blue-300 border-blue-800/40',
  'Dance': 'bg-red-900/40 text-red-300 border-red-800/40',
  'Arts': 'bg-purple-900/40 text-purple-300 border-purple-800/40',
  'Ceremonies': 'bg-green-900/40 text-green-300 border-green-800/40',
  'Education': 'bg-cyan-900/40 text-cyan-300 border-cyan-800/40',
  'Community': 'bg-pink-900/40 text-pink-300 border-pink-800/40',
  'Nature': 'bg-emerald-900/40 text-emerald-300 border-emerald-800/40',
  'General': 'bg-umurage-card text-umurage-muted border-umurage-border',
};

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ---- Hooks ----
function useTopics(category: string, page: number) {
  return useQuery({
    queryKey: ['discussion-topics', category, page],
    queryFn: async () => {
      let query = supabase
        .from('discussion_topics')
        .select(`*, author:user_profiles!discussion_topics_user_id_fkey(id, username, avatar_url, verified, verified_type)`, { count: 'exact' })
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range((page - 1) * 10, page * 10 - 1);
      if (category !== 'All') query = query.eq('category', category);
      const { data, error, count } = await query;
      if (error) throw error;
      return { topics: data || [], total: count || 0 };
    },
    staleTime: 30000,
  });
}

function useReplies(topicId: string | null) {
  return useQuery({
    queryKey: ['discussion-replies', topicId],
    queryFn: async () => {
      if (!topicId) return [];
      const { data, error } = await supabase
        .from('discussion_replies')
        .select(`*, author:user_profiles!discussion_replies_user_id_fkey(id, username, avatar_url, verified)`)
        .eq('topic_id', topicId)
        .order('votes', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!topicId,
  });
}

function useUserVotes(userId?: string) {
  return useQuery({
    queryKey: ['user-votes', userId],
    queryFn: async () => {
      if (!userId) return new Map<string, string>();
      const { data } = await supabase
        .from('discussion_votes')
        .select('topic_id, reply_id, vote_type')
        .eq('user_id', userId);
      const map = new Map<string, string>();
      (data || []).forEach(v => map.set(v.topic_id || v.reply_id, v.vote_type));
      return map;
    },
    enabled: !!userId,
  });
}

function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (topic: { user_id: string; title: string; body: string; category: string }) => {
      const { data, error } = await supabase.from('discussion_topics').insert(topic).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discussion-topics'] }); toast.success('Discussion created!'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

function useCreateReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reply: { topic_id: string; user_id: string; content: string }) => {
      const { data, error } = await supabase.from('discussion_replies').insert(reply).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, { topic_id }) => {
      qc.invalidateQueries({ queryKey: ['discussion-replies', topic_id] });
      qc.invalidateQueries({ queryKey: ['discussion-topics'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function useVoteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, topicId, voteType, currentVote }: { userId: string; topicId: string; voteType: 'up' | 'down'; currentVote?: string }) => {
      if (currentVote === voteType) {
        await supabase.from('discussion_votes').delete().eq('user_id', userId).eq('topic_id', topicId);
        const delta = voteType === 'up' ? -1 : 1;
        await supabase.from('discussion_topics').update({ votes: supabase.rpc as unknown as number }).eq('id', topicId);
        // Use raw update
        const { data: t } = await supabase.from('discussion_topics').select('votes').eq('id', topicId).single();
        await supabase.from('discussion_topics').update({ votes: (t?.votes || 0) + delta }).eq('id', topicId);
      } else {
        const delta = voteType === 'up' ? (currentVote ? 2 : 1) : (currentVote ? -2 : -1);
        if (currentVote) {
          await supabase.from('discussion_votes').update({ vote_type: voteType }).eq('user_id', userId).eq('topic_id', topicId);
        } else {
          await supabase.from('discussion_votes').insert({ user_id: userId, topic_id: topicId, vote_type: voteType });
        }
        const { data: t } = await supabase.from('discussion_topics').select('votes').eq('id', topicId).single();
        await supabase.from('discussion_topics').update({ votes: (t?.votes || 0) + delta }).eq('id', topicId);
      }
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['discussion-topics'] });
      qc.invalidateQueries({ queryKey: ['user-votes', userId] });
    },
    onError: () => toast.error('Failed to vote'),
  });
}

// ---- New Topic Modal ----
const NewTopicModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, openAuth } = useAuth();
  const createTopic = useCreateTopic();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Traditions');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { openAuth('login'); return; }
    if (!title.trim() || !body.trim()) { toast.error('Please fill in all fields'); return; }
    await createTopic.mutateAsync({ user_id: user.id, title: title.trim(), body: body.trim(), category });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl p-7 animate-fade-in z-10" style={{ background: 'rgba(22, 14, 5, 0.99)', border: '1px solid rgba(200,150,12,0.3)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-umurage-subtle hover:text-umurage-cream"><X size={18} /></button>
        <h2 className="font-cinzel text-umurage-gold text-lg font-bold mb-5">Start a New Discussion</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Topic Title *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              className="w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60"
            />
          </div>
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Category *</label>
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream focus:outline-none focus:border-umurage-gold/60 cursor-pointer"
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Your thoughts *</label>
            <textarea
              value={body} onChange={e => setBody(e.target.value)}
              placeholder="Share your knowledge, questions, or experiences about Rwandan culture..."
              rows={5}
              className="w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 resize-none leading-relaxed"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm text-umurage-muted border border-umurage-border rounded-xl hover:border-umurage-gold/30 transition-colors">Cancel</button>
            <button type="submit" disabled={createTopic.isPending} className="flex-1 btn-gold py-3 text-sm flex items-center justify-center gap-2">
              {createTopic.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
              Post Discussion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Topic Detail View ----
const TopicDetail: React.FC<{ topic: Record<string, unknown>; onBack: () => void }> = ({ topic, onBack }) => {
  const { user, isAuthenticated, openAuth } = useAuth();
  const { data: replies = [], isLoading } = useReplies(topic.id as string);
  const createReply = useCreateReply();
  const [replyText, setReplyText] = useState('');

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) { openAuth('login'); return; }
    if (!replyText.trim()) return;
    await createReply.mutateAsync({ topic_id: topic.id as string, user_id: user.id, content: replyText.trim() });
    setReplyText('');
  };

  const author = topic.author as Record<string, unknown> | null;

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-umurage-muted hover:text-umurage-cream text-sm mb-5 transition-colors">
        <ChevronLeft size={16} /> Back to Discussions
      </button>

      {/* Topic */}
      <div className="umurage-card rounded-2xl p-6 mb-5">
        <div className="flex items-start gap-3 mb-4">
          <img
            src={(author?.avatar_url as string) || `https://api.dicebear.com/7.x/initials/svg?seed=${author?.username}`}
            alt={(author?.username as string) || 'Author'}
            className="w-10 h-10 rounded-full object-cover border border-umurage-border flex-shrink-0"
          />
          <div>
            <span className="text-umurage-cream font-semibold text-sm">{(author?.username as string) || 'Unknown'}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${CAT_COLORS[topic.category as string] || CAT_COLORS.General}`}>
                {topic.category as string}
              </span>
              <span className="text-umurage-subtle text-xs">{timeAgo(topic.created_at as string)}</span>
            </div>
          </div>
        </div>
        <h2 className="font-cinzel text-umurage-gold text-xl font-bold mb-3">{topic.title as string}</h2>
        <p className="text-umurage-cream text-sm leading-relaxed">{topic.body as string}</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-umurage-border/50 text-umurage-subtle text-sm">
          <span className="flex items-center gap-1.5"><MessageSquare size={13} /> {topic.replies_count as number} replies</span>
          <span className="flex items-center gap-1.5"><Eye size={13} /> {topic.views as number} views</span>
          <span className="flex items-center gap-1.5"><ArrowUp size={13} /> {topic.votes as number} votes</span>
        </div>
      </div>

      {/* Replies */}
      <h3 className="section-title mb-4">{(topic.replies_count as number) || 0} Replies</h3>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="text-umurage-gold animate-spin" /></div>
      ) : replies.length === 0 ? (
        <div className="umurage-card rounded-2xl p-8 text-center mb-5">
          <MessageSquare size={32} className="text-umurage-gold/30 mx-auto mb-3" />
          <p className="text-umurage-muted text-sm">No replies yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4 mb-5">
          {(replies as Record<string, unknown>[]).map(reply => {
            const rAuthor = reply.author as Record<string, unknown> | null;
            return (
              <div key={reply.id as string} className="umurage-card rounded-2xl p-5 animate-fade-in">
                <div className="flex gap-3">
                  <img
                    src={(rAuthor?.avatar_url as string) || `https://api.dicebear.com/7.x/initials/svg?seed=${rAuthor?.username}`}
                    alt={(rAuthor?.username as string) || 'User'}
                    className="w-9 h-9 rounded-full object-cover border border-umurage-border flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-umurage-cream text-sm font-semibold">{(rAuthor?.username as string) || 'User'}</span>
                      <span className="text-umurage-subtle text-xs">{timeAgo(reply.created_at as string)}</span>
                    </div>
                    <p className="text-umurage-muted text-sm leading-relaxed">{reply.content as string}</p>
                    <div className="flex items-center gap-1 mt-3">
                      <span className="text-umurage-subtle text-xs flex items-center gap-1">
                        <ArrowUp size={11} /> {reply.votes as number || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply form */}
      <div className="umurage-card rounded-2xl p-5">
        <h4 className="text-umurage-cream font-semibold text-sm mb-4">Share your thoughts</h4>
        {isAuthenticated ? (
          <form onSubmit={handleReply} className="space-y-3">
            <div className="flex gap-3">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                alt={user?.name || 'You'}
                className="w-9 h-9 rounded-full object-cover border border-umurage-border flex-shrink-0"
              />
              <textarea
                value={replyText} onChange={e => setReplyText(e.target.value)}
                placeholder="Add your reply..."
                rows={3}
                className="flex-1 bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={!replyText.trim() || createReply.isPending} className="btn-gold text-sm px-5 py-2.5 flex items-center gap-2">
                {createReply.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Post Reply
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4">
            <p className="text-umurage-muted text-sm mb-3">Sign in to join the discussion</p>
            <button onClick={() => openAuth('login')} className="btn-gold text-sm px-6 py-2.5">Sign In</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ---- Main Discussions Page ----
const Discussions: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user, openAuth } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Record<string, unknown> | null>(null);
  const { data: userVotes } = useUserVotes(user?.id);
  const voteTopic = useVoteTopic();

  const { data, isLoading } = useTopics(activeCategory, page);
  const topics = data?.topics || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const handleVote = (e: React.MouseEvent, topicId: string, voteType: 'up' | 'down') => {
    e.stopPropagation();
    if (!isAuthenticated || !user) { openAuth('login'); return; }
    const currentVote = userVotes?.get(topicId);
    voteTopic.mutate({ userId: user.id, topicId, voteType, currentVote });
  };

  if (selectedTopic) {
    return <TopicDetail topic={selectedTopic} onBack={() => setSelectedTopic(null)} />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold mb-2">{t('discussions.title')}</h1>
          <p className="text-umurage-muted text-sm">Join community discussions about Rwandan culture, traditions, and heritage.</p>
        </div>
        <button
          onClick={() => isAuthenticated ? setShowNewTopic(true) : openAuth('login')}
          className="btn-gold flex items-center gap-2 flex-shrink-0"
        >
          <PlusCircle size={16} />
          New Discussion
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setPage(1); }}
            className={`flex-shrink-0 text-xs px-4 py-2 rounded-full border font-semibold transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-umurage-gold text-umurage-bg border-umurage-gold'
                : 'border-umurage-border text-umurage-muted hover:border-umurage-gold/40 hover:text-umurage-gold bg-umurage-card'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-5 text-umurage-subtle text-xs">
        <span>{total} discussions</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Filter size={11} /> Filtered by: {activeCategory}</span>
      </div>

      {/* Topics list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="text-umurage-gold animate-spin" /></div>
      ) : topics.length === 0 ? (
        <div className="umurage-card rounded-2xl p-12 text-center">
          <MessageSquare size={40} className="text-umurage-gold/30 mx-auto mb-4" />
          <h3 className="text-umurage-cream font-semibold text-lg mb-2">No discussions yet</h3>
          <p className="text-umurage-muted text-sm mb-5">Be the first to start a conversation in this category!</p>
          <button onClick={() => setShowNewTopic(true)} className="btn-gold px-6 py-2.5 text-sm">Start Discussion</button>
        </div>
      ) : (
        <div className="space-y-3">
          {(topics as Record<string, unknown>[]).map(topic => {
            const author = topic.author as Record<string, unknown> | null;
            const currentVote = userVotes?.get(topic.id as string);
            return (
              <div
                key={topic.id as string}
                onClick={() => setSelectedTopic(topic)}
                className="umurage-card rounded-2xl p-5 cursor-pointer group hover:border-umurage-gold/20 transition-all duration-200"
              >
                {(topic.pinned as boolean) && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Pin size={12} className="text-umurage-gold" />
                    <span className="text-umurage-gold text-xs font-semibold">Pinned Discussion</span>
                  </div>
                )}
                <div className="flex gap-4">
                  {/* Vote column */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button
                      onClick={e => handleVote(e, topic.id as string, 'up')}
                      className={`p-1.5 rounded-lg transition-colors ${currentVote === 'up' ? 'text-green-400 bg-green-900/30' : 'text-umurage-subtle hover:text-green-400 hover:bg-green-900/20'}`}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <span className={`text-xs font-bold ${(topic.votes as number) > 0 ? 'text-green-400' : (topic.votes as number) < 0 ? 'text-red-400' : 'text-umurage-subtle'}`}>
                      {topic.votes as number}
                    </span>
                    <button
                      onClick={e => handleVote(e, topic.id as string, 'down')}
                      className={`p-1.5 rounded-lg transition-colors ${currentVote === 'down' ? 'text-red-400 bg-red-900/30' : 'text-umurage-subtle hover:text-red-400 hover:bg-red-900/20'}`}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <img
                        src={(author?.avatar_url as string) || `https://api.dicebear.com/7.x/initials/svg?seed=${author?.username}`}
                        alt={(author?.username as string) || 'User'}
                        className="w-8 h-8 rounded-full object-cover border border-umurage-border flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-umurage-cream font-semibold text-base leading-snug group-hover:text-umurage-gold transition-colors line-clamp-2 mb-1">
                          {topic.title as string}
                        </h3>
                        <p className="text-umurage-subtle text-xs line-clamp-1">{topic.body as string}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-umurage-muted text-xs">{(author?.username as string) || 'User'}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${CAT_COLORS[topic.category as string] || CAT_COLORS.General}`}>
                        {topic.category as string}
                      </span>
                      <span className="text-umurage-subtle text-xs">{timeAgo(topic.created_at as string)}</span>
                    </div>
                    <div className="flex items-center gap-5 mt-3">
                      <span className="flex items-center gap-1.5 text-umurage-subtle text-xs">
                        <MessageSquare size={12} /> {topic.replies_count as number || 0} replies
                      </span>
                      <span className="flex items-center gap-1.5 text-umurage-subtle text-xs">
                        <Eye size={12} /> {topic.views as number || 0} views
                      </span>
                      <span className="flex items-center gap-1.5 text-umurage-gold text-xs font-medium ml-auto">
                        View Discussion <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-outline-gold text-xs py-2 px-4 disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="text-umurage-muted text-sm px-4">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-outline-gold text-xs py-2 px-4 disabled:opacity-40 flex items-center gap-1"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* New Topic Modal */}
      {showNewTopic && <NewTopicModal onClose={() => setShowNewTopic(false)} />}
    </div>
  );
};

export default Discussions;
