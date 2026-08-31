import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Send, Image as ImageIcon, Search, MessageSquare, Check, CheckCheck,
  Loader2, Copy, Edit2, Trash2, X, CornerUpLeft, ChevronLeft, UserPlus, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMessages } from '@/hooks/useMessages';
import { toast } from 'sonner';

function formatMessageTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const Messages: React.FC = () => {
  const { user, isAuthenticated, openAuth } = useAuth();
  const { t } = useLanguage();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    availableProfiles,
    loadingConversations,
    loadingMessages,
    loadMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    startConversation,
    sendTyping,
    stopTyping,
    typingUsers,
  } = useMessages(user?.id);

  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId]
  );

  const handleStartChatWithProfile = async (profileId: string) => {
    setIsStartingChat(true);
    try {
      const convId = await startConversation(profileId);
      if (convId) {
        setActiveConversationId(convId);
        setSearchQuery('');
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to start conversation');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);
    if (activeConversationId) {
      if (e.target.value.trim()) {
        sendTyping(activeConversationId);
      } else {
        stopTyping(activeConversationId);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId) return;
    if (!inputContent.trim() && !selectedFile) return;

    try {
      let finalContent = inputContent;
      if (replyToMessage) {
        finalContent = `Replying to: "${replyToMessage.content.slice(0, 35)}..." \n${inputContent}`;
      }

      await sendMessage({
        conversationId: activeConversationId,
        content: finalContent,
        mediaFile: selectedFile,
      });

      setInputContent('');
      setSelectedFile(null);
      setReplyToMessage(null);
      if (activeConversationId) stopTyping(activeConversationId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Message copied to clipboard');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateMessage(messageId, editContent);
      toast.success('Message edited');
      setEditingMessageId(null);
      setEditContent('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to edit message');
    }
  };

  const handleDeleteMsg = async (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(messageId);
        toast.success('Message deleted');
      } catch (e: any) {
        toast.error(e.message || 'Failed to delete message');
      }
    }
  };

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return availableProfiles.filter((p) => {
      const matchUser = p.username?.toLowerCase().includes(q);
      const matchName = p.full_name?.toLowerCase().includes(q);
      return matchUser || matchName;
    });
  }, [availableProfiles, searchQuery]);

  const activeTypingUsers = activeConversationId ? typingUsers[activeConversationId] || [] : [];

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <MessageSquare size={48} className="text-umurage-gold mb-4" />
        <h2 className="font-cinzel text-2xl text-umurage-gold font-bold mb-2">Direct Messages</h2>
        <p className="text-umurage-muted text-sm max-w-md mb-6">
          Sign in to connect, chat, and preserve stories directly with the Umurage community.
        </p>
        <button onClick={() => openAuth('login')} className="btn-gold px-6 py-2.5 font-bold">
          Sign In to Chat
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col md:flex-row h-[calc(100vh-140px)] rounded-2xl overflow-hidden border border-[#5c3c1e] bg-[#140d08]">
      {/* Left Column: Conversations & Search */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-[#3d240e] flex flex-col bg-[#1a110a] flex-shrink-0 ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header & Search */}
        <div className="p-3.5 border-b border-[#3d240e] space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel text-lg text-amber-300 font-bold">Messages</h2>
            <span className="text-[10px] text-amber-200/60 font-semibold">{conversations.length} chats</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-200/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people to chat..."
              className="w-full bg-[#24170d] border border-[#4a2e16] rounded-xl pl-9 pr-8 py-2 text-xs text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-200/50 hover:text-amber-50"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List or Search Results */}
        <div className="flex-1 overflow-y-auto space-y-1 p-2">
          {searchQuery ? (
            <div>
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <p className="text-[10px] uppercase font-bold text-amber-400/70">People</p>
                {isStartingChat && <Loader2 size={12} className="animate-spin text-amber-400" />}
              </div>
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-6 px-3 text-amber-200/50 text-xs italic">
                  No people found matching "{searchQuery}"
                </div>
              ) : (
                filteredProfiles.map((prof) => (
                  <button
                    key={prof.id}
                    disabled={isStartingChat}
                    onClick={() => handleStartChatWithProfile(prof.id)}
                    className="w-full p-2.5 rounded-xl text-left hover:bg-[#28180d] transition-all flex items-center gap-3 border border-transparent hover:border-[#4a2e16] disabled:opacity-50"
                  >
                    <img
                      src={prof.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${prof.username || prof.full_name}`}
                      alt={prof.username || 'User'}
                      className="w-10 h-10 rounded-full object-cover border border-amber-700/50 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-amber-50 truncate">{prof.full_name || prof.username}</p>
                        {prof.verified && <Shield size={11} className="text-green-400 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-amber-200/60 truncate">@{prof.username || 'user'}</p>
                    </div>
                    <UserPlus size={14} className="text-amber-400/60" />
                  </button>
                ))
              )}
            </div>
          ) : loadingConversations ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-amber-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4 text-amber-200/60 text-xs">
              <MessageSquare size={36} className="text-amber-400/30 mx-auto mb-3" />
              <p className="font-semibold text-amber-200 mb-1">No conversations yet</p>
              <p className="text-[11px] text-amber-200/50">Search for someone above to start chatting.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 ${
                    isActive
                      ? 'bg-amber-900/40 border border-amber-500/60'
                      : 'hover:bg-[#24170d] border border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={conv.participant.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.participant.username}`}
                      alt={conv.participant.username || 'User'}
                      className="w-11 h-11 rounded-full object-cover border border-amber-700/40"
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-semibold text-amber-50 truncate">
                        {conv.participant.full_name || conv.participant.username}
                      </p>
                      <span className="text-[10px] text-amber-200/40 flex-shrink-0 ml-1">
                        {formatMessageTime(conv.updatedAt)}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'text-amber-300 font-semibold' : 'text-amber-200/60'}`}>
                      {conv.lastMessage?.content || 'Started a conversation'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Chat Stream & Message Bar */}
      <div className={`flex-1 flex flex-col bg-[#140d08] ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Chat Top Header */}
            <div className="p-3.5 border-b border-[#3d240e] bg-[#1a110a] flex items-center gap-3">
              <button
                onClick={() => setActiveConversationId(null)}
                className="md:hidden p-1.5 rounded-lg text-amber-300 hover:bg-[#24170d] mr-1"
                title="Back to conversation list"
              >
                <ChevronLeft size={20} />
              </button>

              <img
                src={activeConversation.participant.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${activeConversation.participant.username}`}
                alt={activeConversation.participant.username || 'User'}
                className="w-9 h-9 rounded-full object-cover border border-amber-700/40 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-amber-300 truncate">
                    {activeConversation.participant.full_name || activeConversation.participant.username}
                  </p>
                  {activeConversation.participant.verified && (
                    <Shield size={12} className="text-green-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Active on Umurage Hub
                </p>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-16">
                  <Loader2 size={22} className="animate-spin text-amber-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 text-amber-200/50 text-xs">
                  <MessageSquare size={36} className="text-amber-400/30 mx-auto mb-2" />
                  <p className="font-semibold text-amber-300 mb-1">Start chatting</p>
                  <p>Say "Muraho!" to {activeConversation.participant.full_name || activeConversation.participant.username}.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelf = msg.sender_id === user?.id;
                  const isEditing = editingMessageId === msg.id;

                  return (
                    <div key={msg.id} className={`flex gap-2.5 group ${isSelf ? 'flex-row-reverse' : ''}`}>
                      <div className={`max-w-[75%] flex flex-col ${isSelf ? 'items-end' : ''}`}>
                        <div
                          className={`relative p-3 rounded-2xl text-xs leading-relaxed ${
                            isSelf
                              ? 'bg-amber-900/60 text-amber-50 rounded-tr-xs border border-amber-600/40'
                              : 'bg-[#22160d] text-amber-50 rounded-tl-xs border border-[#4a2e16]'
                          }`}
                        >
                          {msg.media_url && (
                            <img src={msg.media_url} alt="Attachment" className="rounded-xl mb-2 max-h-56 object-cover" />
                          )}

                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-[#18110a] border border-amber-500 rounded px-2 py-1 text-xs text-amber-50 focus:outline-none"
                              />
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => setEditingMessageId(null)}
                                  className="text-[10px] text-amber-200/60 hover:text-amber-100 px-2 py-0.5"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(msg.id)}
                                  className="text-[10px] text-amber-400 font-bold hover:underline px-2 py-0.5"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                          )}

                          {/* Hover Actions */}
                          <div
                            className={`absolute top-1 ${
                              isSelf ? '-left-20' : '-right-20'
                            } opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 p-1 rounded-lg flex items-center gap-1 border border-amber-800/40 text-[10px] z-10`}
                          >
                            <button onClick={() => handleCopyMessage(msg.content)} title="Copy">
                              <Copy size={12} className="text-amber-300" />
                            </button>
                            <button onClick={() => setReplyToMessage(msg)} title="Reply">
                              <CornerUpLeft size={12} className="text-amber-300" />
                            </button>
                            {isSelf && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingMessageId(msg.id);
                                    setEditContent(msg.content);
                                  }}
                                  title="Edit"
                                >
                                  <Edit2 size={12} className="text-amber-300" />
                                </button>
                                <button onClick={() => handleDeleteMsg(msg.id)} title="Delete">
                                  <Trash2 size={12} className="text-red-400" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[9px] text-amber-200/50 mt-1 px-1">
                          <span>{formatMessageTime(msg.created_at)}</span>
                          {isSelf && (msg.read ? <CheckCheck size={12} className="text-blue-400" /> : <Check size={12} />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {activeTypingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-400/80 italic p-1 animate-pulse">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                  <span>typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyToMessage && (
              <div className="px-4 py-2 bg-[#24170d] border-t border-[#3d240e] text-xs text-amber-300 flex items-center justify-between">
                <span className="truncate">Replying to: "{replyToMessage.content.slice(0, 40)}..."</span>
                <button onClick={() => setReplyToMessage(null)} className="text-amber-200/60 hover:text-amber-100">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Message Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-[#3d240e] bg-[#1a110a] flex items-center gap-2">
              <label className="cursor-pointer text-amber-400 p-2 hover:bg-[#24170d] rounded-xl transition-colors">
                <ImageIcon size={18} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              <input
                ref={inputRef}
                type="text"
                value={inputContent}
                onChange={handleInputChange}
                placeholder={`Message ${activeConversation.participant.full_name || activeConversation.participant.username}...`}
                className="flex-1 bg-[#24170d] border border-[#4a2e16] rounded-xl px-3.5 py-2 text-xs text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
              />

              <button
                type="submit"
                disabled={!inputContent.trim() && !selectedFile}
                className="btn-gold p-2 rounded-xl text-black font-bold disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-amber-200/50">
            <MessageSquare size={44} className="text-amber-400/40 mb-3" />
            <h3 className="text-amber-300 font-cinzel text-base font-bold mb-1">Select a Conversation</h3>
            <p className="text-xs max-w-xs leading-relaxed">
              Choose an existing chat or search for a community member to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
