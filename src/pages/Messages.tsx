import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Send, Loader2, MessageSquare, UserRound, CheckCheck, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function formatTime(date: string | null) {
  if (!date) return '';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    loadingConversations,
    loadingMessages,
    loadMessages,
    sendMessage,
    startConversation,
    availableProfiles,
    sendTyping,
    stopTyping,
    typingUsers,
  } = useMessages(user?.id);

  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations, setActiveConversationId]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.id === activeConversationId) || null;
  }, [activeConversationId, conversations]);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return availableProfiles;
    const lower = searchQuery.toLowerCase();
    return availableProfiles.filter(
      (p) =>
        (p.full_name && p.full_name.toLowerCase().includes(lower)) ||
        (p.username && p.username.toLowerCase().includes(lower))
    );
  }, [availableProfiles, searchQuery]);

  const handleStartConversation = async (recipientId: string) => {
    const conversationId = await startConversation(recipientId);
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
  };

  const handleSend = async () => {
    if (!activeConversationId || (!draft.trim() && !selectedFile)) return;

    setSending(true);
    try {
      await sendMessage({ conversationId: activeConversationId, content: draft, mediaFile: selectedFile });
      setDraft('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      stopTyping(activeConversationId);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (activeConversationId) {
      sendTyping(activeConversationId);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col overflow-hidden rounded-[28px] border border-[#4a2a12]/70 bg-[#1b120b]/90 shadow-[0_18px_70px_rgba(0,0,0,0.28)] lg:flex-row">
      <aside className="w-full border-b border-[#4a2a12]/70 bg-[#140d07] p-4 lg:w-[340px] lg:border-b-0 lg:border-r">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">Messages</p>
            <h2 className="mt-1 text-xl font-semibold text-amber-50">Conversations</h2>
          </div>
          <button onClick={() => navigate('/')} className="rounded-full border border-[#5c3417] p-2 text-amber-100/80 hover:bg-[#28180c]">
            <ArrowLeft size={16} />
          </button>
        </div>

        {/* Search Users */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-200/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member by name..."
            className="w-full rounded-xl border border-[#3d2510] bg-[#221509] pl-9 pr-3 py-2 text-xs text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/50"
          />
        </div>

        {/* Member Suggestions Grid */}
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/60">Community Members</p>
          <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
            {filteredProfiles.length === 0 ? (
              <p className="text-xs text-amber-100/50 py-1">No matching member found.</p>
            ) : (
              filteredProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleStartConversation(profile.id)}
                  className="flex w-full items-center gap-2 rounded-xl border border-[#3d2510] bg-[#221509] px-2.5 py-1.5 text-left text-xs text-amber-50 hover:border-amber-400/40 hover:bg-[#2c1b0c] transition-colors"
                >
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-amber-900 text-amber-200">{profile.full_name?.[0] || profile.username?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="truncate flex-1">{profile.full_name || profile.username || 'Community member'}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Existing Conversations List */}
        <div className="space-y-2">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/60">Recent Chats</p>
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8 text-amber-200/70 text-xs">
              <Loader2 className="mr-2 animate-spin" size={14} />
              Loading chats…
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#5c3417] p-4 text-center text-xs text-amber-100/70">
              <MessageSquare className="mx-auto mb-2 text-amber-400/40" size={22} />
              No existing chats yet. Pick a member above to start chatting.
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveConversationId(conversation.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                  activeConversationId === conversation.id
                    ? 'border-amber-400/50 bg-[#3f260f] shadow-sm'
                    : 'border-[#3d2510] bg-[#221509] hover:bg-[#2b1a0c]'
                }`}
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={conversation.participant.avatar_url || undefined} />
                  <AvatarFallback className="bg-amber-950 text-amber-200">{conversation.participant.full_name?.[0] || conversation.participant.username?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-amber-50">
                      {conversation.participant.full_name || conversation.participant.username || 'Conversation'}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-[#140c06]">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-amber-100/60">{conversation.lastMessage?.content || 'Started conversation'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Screen */}
      <div className="flex flex-1 flex-col">
        {activeConversation ? (
          <>
            <div className="flex items-center gap-3 border-b border-[#4a2a12]/70 bg-[#140d07] px-4 py-3.5">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activeConversation.participant.avatar_url || undefined} />
                <AvatarFallback className="bg-amber-900 text-amber-100">{activeConversation.participant.full_name?.[0] || activeConversation.participant.username?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-amber-50">
                  {activeConversation.participant.full_name || activeConversation.participant.username || 'Conversation'}
                </p>
                <p className="text-xs text-amber-200/60">
                  {typingUsers[activeConversation.id]?.length ? 'typing…' : 'Online · Cultural Exchange'}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(218,163,72,0.08),_transparent_50%)] p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-10 text-amber-200/70 text-xs">
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Loading messages…
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#5c3417] p-8 text-center text-xs text-amber-100/70 max-w-sm mx-auto">
                  <UserRound className="mx-auto mb-2 text-amber-400/40" size={28} />
                  No messages in this chat yet. Send a warm greeting to start exchanging cultural knowledge.
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_id === user?.id;
                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          isMine ? 'bg-amber-400 text-[#140c06] rounded-tr-sm' : 'bg-[#221509] border border-[#4a2a12] text-amber-50 rounded-tl-sm'
                        }`}
                      >
                        {message.media_url && <img src={message.media_url} alt="Shared media" className="mb-2 max-h-56 rounded-xl object-cover" />}
                        {message.content && <p className="text-xs leading-relaxed">{message.content}</p>}
                        <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${isMine ? 'text-[#6b3a0a]' : 'text-amber-100/50'}`}>
                          <span>{formatTime(message.created_at)}</span>
                          {isMine && <CheckCheck size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[#4a2a12]/70 bg-[#140d07] p-3">
              {selectedFile && (
                <div className="mb-2 rounded-xl border border-amber-400/30 bg-[#221509] p-2 text-xs text-amber-100/80 flex items-center justify-between">
                  <span className="truncate">Attachment: {selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} className="text-amber-200/50 hover:text-amber-50">✕</button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-amber-100/80 hover:bg-[#28180c]">
                  <ImagePlus size={16} />
                </Button>
                <Input
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (e.target.value.trim()) {
                      handleTyping();
                    }
                  }}
                  onBlur={() => stopTyping(activeConversationId || '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a thoughtful message..."
                  className="border-[#4a2a12] bg-[#221509] text-xs text-amber-50 placeholder:text-amber-100/40"
                />
                <Button
                  onClick={() => {
                    handleSend();
                    stopTyping(activeConversationId || '');
                  }}
                  disabled={sending || (!draft.trim() && !selectedFile)}
                  className="bg-amber-400 text-[#140c06] hover:bg-amber-300 font-bold"
                >
                  {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-[#140d07] text-xs text-amber-100/60 p-6 text-center">
            Select a conversation from the left sidebar or search a member to start a new chat.
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
