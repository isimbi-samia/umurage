import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadMediaToStorage } from '@/lib/uploadMedia';

export interface MessageProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  created_at: string | null;
  media_url: string | null;
  read: boolean | null;
  sender_id: string;
  sender: MessageProfile | null;
}

export interface ConversationSummary {
  id: string;
  participant: MessageProfile;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string | null;
}

export function useMessages(userId?: string) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<MessageProfile[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const channelRef = useRef<any>(null);

  const clearTypingTimer = useCallback((conversationId: string, senderId: string) => {
    const key = `${conversationId}:${senderId}`;
    if (typingTimeoutsRef.current[key]) {
      clearTimeout(typingTimeoutsRef.current[key]);
      delete typingTimeoutsRef.current[key];
    }
  }, []);

  const loadAvailableProfiles = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, verified')
      .neq('id', userId)
      .order('full_name', { ascending: true })
      .limit(30);

    if (!error) {
      setAvailableProfiles((data || []) as MessageProfile[]);
    }
  }, [userId]);

  const refreshConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    setLoadingConversations(true);

    const { data: memberships, error } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);

    if (error) {
      setLoadingConversations(false);
      return;
    }

    const conversationIds = [...new Set((memberships || []).map((row: { conversation_id: string }) => row.conversation_id))];

    const summaries = await Promise.all(
      conversationIds.map(async (conversationId) => {
        const { data: membersData } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', conversationId);

        const otherUserIds = (membersData || [])
          .filter((member: { user_id: string }) => member.user_id !== userId)
          .map((member: { user_id: string }) => member.user_id);

        let participant: MessageProfile | null = null;
        if (otherUserIds.length > 0) {
          const { data: participantData } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, verified')
            .in('id', otherUserIds)
            .maybeSingle();
          participant = participantData as MessageProfile | null;
        }

        if (!participant) {
          const { data: selfData } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, verified')
            .eq('id', userId)
            .maybeSingle();
          participant = selfData as MessageProfile | null;
        }

        const { data: lastMessageRows } = await supabase
          .from('messages')
          .select('id, content, created_at, media_url, read, sender_id')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1);

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .eq('read', false)
          .neq('sender_id', userId);

        const lastMessage = lastMessageRows?.[0]
          ? ({
              ...lastMessageRows[0],
              sender: null,
            } as ChatMessage)
          : null;

        const { data: conversationMeta } = await supabase
          .from('conversations')
          .select('id, updated_at')
          .eq('id', conversationId)
          .maybeSingle();

        return {
          id: conversationId,
          participant: participant || {
            id: conversationId,
            username: 'Conversation',
            full_name: 'Conversation',
            avatar_url: null,
            verified: false,
          },
          lastMessage,
          unreadCount: count || 0,
          updatedAt: conversationMeta?.updated_at || lastMessage?.created_at || null,
        } as ConversationSummary;
      })
    );

    summaries.sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

    setConversations(summaries);
    setLoadingConversations(false);
  }, [userId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!userId) return;

    setLoadingMessages(true);
    const { data: rows, error } = await supabase
      .from('messages')
      .select('id, content, created_at, media_url, read, sender_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      setLoadingMessages(false);
      return;
    }

    const senderIds = [...new Set((rows || []).map((row: { sender_id: string }) => row.sender_id))];
    const { data: profilesData } = senderIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, verified')
          .in('id', senderIds)
      : { data: [] };

    const profileMap = new Map((profilesData || []).map((profile) => [profile.id, profile]));
    const mappedMessages = (rows || []).map((row) => ({
      ...row,
      sender: profileMap.get(row.sender_id) || null,
    })) as ChatMessage[];

    setMessages(mappedMessages);
    setLoadingMessages(false);

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('read', false)
      .neq('sender_id', userId);
  }, [userId]);

  const sendMessage = useCallback(async ({
    conversationId,
    content,
    mediaFile,
  }: {
    conversationId: string;
    content?: string;
    mediaFile?: File | null;
  }) => {
    if (!userId) return;

    let mediaUrl: string | null = null;
    if (mediaFile) {
      const upload = await uploadMediaToStorage(mediaFile, 'image', userId, `chat/${conversationId}`);
      mediaUrl = upload.url;
    }

    const payload: Record<string, unknown> = {
      conversation_id: conversationId,
      content: content?.trim() || '',
      sender_id: userId,
      read: false,
      media_url: mediaUrl,
    };

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert(payload)
      .select('id, content, created_at, media_url, read, sender_id')
      .single();

    if (error) throw error;

    const { data: senderData } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, verified')
      .eq('id', userId)
      .maybeSingle();

    const optimisticMessage = {
      ...(inserted as ChatMessage),
      sender: senderData as MessageProfile | null,
    } as ChatMessage;

    setMessages((prev) => [...prev, optimisticMessage]);
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
    await refreshConversations();
  }, [refreshConversations, userId]);

  const startConversation = useCallback(async (recipientId: string) => {
    if (!userId) return null;

    const { data: createdConversation, error: createConversationError } = await supabase
      .from('conversations')
      .insert({})
      .select('id')
      .single();

    if (createConversationError || !createdConversation) {
      throw createConversationError || new Error('Unable to create a new conversation');
    }

    const conversationId = createdConversation.id;
    const members = [
      { conversation_id: conversationId, user_id: userId },
      { conversation_id: conversationId, user_id: recipientId },
    ];

    const { error: membersError } = await supabase.from('conversation_members').insert(members);
    if (membersError) throw membersError;

    setActiveConversationId(conversationId);
    setMessages([]);
    await refreshConversations();
    return conversationId;
  }, [refreshConversations, userId]);

  const sendTyping = useCallback((conversationId: string) => {
    if (!userId || !channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { conversation_id: conversationId, user_id: userId },
    });

    const timerKey = `${conversationId}:${userId}`;
    if (typingTimeoutsRef.current[timerKey]) {
      clearTimeout(typingTimeoutsRef.current[timerKey]);
    }
    typingTimeoutsRef.current[timerKey] = setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { conversation_id: conversationId, user_id: userId },
      });
      delete typingTimeoutsRef.current[timerKey];
    }, 1600);
  }, [userId]);

  const stopTyping = useCallback((conversationId: string) => {
    if (!userId || !channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { conversation_id: conversationId, user_id: userId },
    });
    clearTypingTimer(conversationId, userId);
  }, [clearTypingTimer, userId]);

  useEffect(() => {
    loadAvailableProfiles();
  }, [loadAvailableProfiles]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`chat-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const incoming = payload.new as Record<string, unknown>;
        if (!incoming?.conversation_id) return;

        const conversationId = incoming.conversation_id as string;
        const senderId = incoming.sender_id as string;
        if (!messages.some((message) => message.id === incoming.id)) {
          setMessages((prev) => [...prev, {
            id: incoming.id as string,
            content: (incoming.content as string) || '',
            created_at: incoming.created_at as string | null,
            media_url: incoming.media_url as string | null,
            read: incoming.read as boolean | null,
            sender_id: senderId,
            sender: null,
          }]);
        }

        if (senderId !== userId) {
          void supabase.from('messages').update({ read: true }).eq('id', incoming.id).then();
        }

        void refreshConversations();
        if (activeConversationId && conversationId === activeConversationId) {
          void loadMessages(conversationId);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updated = payload.new as Record<string, unknown>;
        if (!updated?.id) return;
        setMessages((prev) => prev.map((message) => message.id === updated.id ? {
          ...message,
          ...updated,
          sender: message.sender,
        } : message));
        void refreshConversations();
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const senderId = payload.payload?.user_id as string | undefined;
        const conversationId = payload.payload?.conversation_id as string | undefined;
        if (!senderId || !conversationId || senderId === userId || conversationId !== activeConversationId) return;

        setTypingUsers((prev) => {
          const current = prev[conversationId] || [];
          if (current.includes(senderId)) return prev;
          return { ...prev, [conversationId]: [...current, senderId] };
        });

        clearTypingTimer(conversationId, senderId);
        typingTimeoutsRef.current[`${conversationId}:${senderId}`] = setTimeout(() => {
          setTypingUsers((prev) => {
            const current = prev[conversationId] || [];
            const nextUsers = current.filter((id) => id !== senderId);
            if (nextUsers.length === 0) {
              const nextState = { ...prev };
              delete nextState[conversationId];
              return nextState;
            }
            return { ...prev, [conversationId]: nextUsers };
          });
          delete typingTimeoutsRef.current[`${conversationId}:${senderId}`];
        }, 1800);
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        const senderId = payload.payload?.user_id as string | undefined;
        const conversationId = payload.payload?.conversation_id as string | undefined;
        if (!senderId || !conversationId || senderId === userId) return;
        clearTypingTimer(conversationId, senderId);
        setTypingUsers((prev) => {
          const current = prev[conversationId] || [];
          const nextUsers = current.filter((id) => id !== senderId);
          if (nextUsers.length === 0) {
            const nextState = { ...prev };
            delete nextState[conversationId];
            return nextState;
          }
          return { ...prev, [conversationId]: nextUsers };
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      void channel.unsubscribe();
      channelRef.current = null;
      Object.values(typingTimeoutsRef.current).forEach((timer) => clearTimeout(timer));
      typingTimeoutsRef.current = {};
    };
  }, [activeConversationId, loadMessages, refreshConversations, userId, clearTypingTimer]);

  useEffect(() => () => {
    Object.values(typingTimeoutsRef.current).forEach((timer) => clearTimeout(timer));
    typingTimeoutsRef.current = {};
  }, []);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    availableProfiles,
    loadingConversations,
    loadingMessages,
    loadMessages,
    refreshConversations,
    sendMessage,
    startConversation,
    sendTyping,
    stopTyping,
    typingUsers,
  };
}
