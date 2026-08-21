import React, { useEffect, useRef, useState } from 'react';
import { Send, Image as ImageIcon, Search, MessageSquare, Check, CheckCheck, Loader2, Copy, Edit2, Trash2, X, CornerUpLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { toast } from 'sonner';

export const Messages: React.FC = () => {
  const { user, isAuthenticated, openAuth } = useAuth();
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
  } = useMessages(user?.id);

  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
      inputRef.current?.focus();
    }
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleStartChatWithProfile = async (profileId: string) => {
    try {
      const convId = await startConversation(profileId);
      if (convId) {
        setActiveConversationId(convId);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to start conversation');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId) return;
    if (!inputContent.trim() && !selectedFile) return;

    try {
      let finalContent = inputContent;
      if (replyToMessage) {
        finalContent = `Replying to: "${replyToMessage.content.slice(0, 30)}..." \n${inputContent}`;
      }

      await sendMessage({
        conversationId: activeConversationId,
        content: finalContent,
        mediaFile: selectedFile,
      });

      setInputContent('');
      setSelectedFile(null);
      setReplyToMessage(null);
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
      toast.error('Failed to edit message');
    }
  };

  const handleDeleteMsg = async (messageId: string) => {
    if (window.confirm('Delete this message?')) {
      try {
        await deleteMessage(messageId);
        toast.success('Message deleted');
      } catch (e: any) {
        toast.error('Failed to delete message');
      }
    }
  };

  const filteredProfiles = availableProfiles.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      (p.username && p.username.toLowerCase().includes(q)) ||
      (p.full_name && p.full_name.toLowerCase().includes(q))
    );
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <MessageSquare size={48} className="text-umurage-gold mb-4" />
        <h2 className="font-cinzel text-2xl text-umurage-gold font-bold mb-2">Private Messaging</h2>
        <p className="text-umurage-muted text-sm max-w-md mb-6">Sign in to connect, chat, and share stories directly with the Umurage community.</p>
        <button onClick={() => openAuth('login')} className="btn-gold px-6 py-2.5 font-bold">Sign In to Chat</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col md:flex-row h-[calc(100vh-140px)] rounded-2xl overflow-hidden border border-[#5c3c1e] bg-[#140d08]">
      {/* Left Sidebar: Conversations & User Search */}
      <div className="w-full md:w-80 border-r border-[#3d240e] flex flex-col bg-[#1a110a] flex-shrink-0">
        <div className="p-3.5 border-b border-[#3d240e] space-y-2">
          <h2 className="font-cinzel text-lg text-amber-300 font-bold">Direct Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-200/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people to chat..."
              className="w-full bg-[#24170d] border border-[#4a2e16] rounded-xl pl-9 pr-3 py-1.5 text-xs text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60"
            />
          </div>
        </div>

        {/* User Search Results or Recent Conversations */}
        <div className="flex-1 overflow-y-auto space-y-1 p-2">
          {searchQuery ? (
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-400/70 px-2 mb-1.5">Available People</p>
              {filteredProfiles.length === 0 ? (
                <p className="text-xs text-amber-200/50 p-2 italic">No matching people found.</p>
              ) : (
                filteredProfiles.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => handleStartChatWithProfile(prof.id)}
                    className="w-full p-2.5 rounded-xl text-left hover:bg-[#28180d] transition-all flex items-center gap-3 border border-transparent hover:border-[#4a2e16]"
                  >
                    <img
                      src={prof.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${prof.username || prof.full_name}`}
                      alt={prof.username || 'User'}
                      className="w-9 h-9 rounded-full object-cover border border-amber-700/50 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-amber-50 truncate">{prof.full_name || prof.username}</p>
                      <p className="text-[10px] text-amber-200/60 truncate">@{prof.username || 'user'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : loadingConversations ? (
            <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-amber-400" /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-amber-200/60 text-xs">
              <p className="mb-2">No active chats yet.</p>
              <p className="text-[11px] text-amber-400 font-semibold">Type a name in the search bar above to start your first chat!</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 ${
                    isActive ? 'bg-amber-900/40 border border-amber-500/60' : 'hover:bg-[#24170d] border border-transparent'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={conv.participant.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.participant.username}`}
                      alt={conv.participant.username || 'User'}
                      className="w-10 h-10 rounded-full object-cover border border-amber-700/40"
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-amber-50 truncate">{conv.participant.full_name || conv.participant.username}</p>
                    </div>
                    <p className="text-[11px] text-amber-200/60 truncate mt-0.5">
                      {conv.lastMessage?.content || 'Click to start chat'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Main Chat Window */}
      <div className="flex-1 flex flex-col bg-[#140d08]">
        {activeConversation ? (
          <>
            {/* Active Header */}
            <div className="p-3.5 border-b border-[#3d240e] bg-[#1a110a] flex items-center gap-3">
              <img
                src={activeConversation.participant.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${activeConversation.participant.username}`}
                alt={activeConversation.participant.username || 'User'}
                className="w-9 h-9 rounded-full object-cover border border-amber-700/40"
              />
              <div>
                <p className="text-xs font-bold text-amber-300">{activeConversation.participant.full_name || activeConversation.participant.username}</p>
                <p className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active in Umurage Hub
                </p>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-amber-200/50 text-xs">
                  Say "Muraho!" to start your conversation with {activeConversation.participant.full_name || activeConversation.participant.username}.
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
                            <img src={msg.media_url} alt="Attachment" className="rounded-xl mb-2 max-h-48 object-cover" />
                          )}

                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-[#18110a] border border-amber-500 rounded px-2 py-1 text-xs text-amber-50"
                              />
                              <div className="flex gap-1 justify-end">
                                <button onClick={() => setEditingMessageId(null)} className="text-[10px] text-amber-200/60">Cancel</button>
                                <button onClick={() => handleSaveEdit(msg.id)} className="text-[10px] text-amber-400 font-bold">Save</button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                          )}

                          {/* Action Bar overlay on hover */}
                          <div className={`absolute top-1 ${isSelf ? '-left-20' : '-right-20'} opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 p-1 rounded-lg flex items-center gap-1 border border-amber-800/40 text-[10px]`}>
                            <button onClick={() => handleCopyMessage(msg.content)} title="Copy"><Copy size={12} className="text-amber-300" /></button>
                            <button onClick={() => setReplyToMessage(msg)} title="Reply"><CornerUpLeft size={12} className="text-amber-300" /></button>
                            {isSelf && (
                              <>
                                <button onClick={() => { setEditingMessageId(msg.id); setEditContent(msg.content); }} title="Edit"><Edit2 size={12} className="text-amber-300" /></button>
                                <button onClick={() => handleDeleteMsg(msg.id)} title="Delete"><Trash2 size={12} className="text-red-400" /></button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[9px] text-amber-200/50 mt-1 px-1">
                          <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          {isSelf && (msg.read ? <CheckCheck size={12} className="text-blue-400" /> : <Check size={12} />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyToMessage && (
              <div className="px-4 py-1.5 bg-[#24170d] border-t border-[#3d240e] text-xs text-amber-300 flex items-center justify-between">
                <span className="truncate">Replying to: "{replyToMessage.content.slice(0, 40)}..."</span>
                <button onClick={() => setReplyToMessage(null)}><X size={14} /></button>
              </div>
            )}

            {/* Input Form */}
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
                onChange={(e) => setInputContent(e.target.value)}
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
            <MessageSquare size={40} className="text-amber-400/40 mb-3" />
            <h3 className="text-amber-300 font-cinzel text-base font-bold mb-1">Select a Conversation</h3>
            <p className="text-xs max-w-xs leading-relaxed">Choose an existing conversation from the list or search for any user to start chatting immediately.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
