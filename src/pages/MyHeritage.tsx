import React, { useState } from 'react';
import { Heart, BookmarkCheck, Users, Camera, Plus, Lock, Globe, Share2, Trash2, Loader2, Sparkles, FolderPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const MyHeritage: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user, openAuth } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'vault' | 'notes'>('vault');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fetch private saved items for the authenticated user only
  const { data: savedItems = [], isLoading } = useQuery({
    queryKey: ['my-heritage-saves', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Query heritage_saves table (strictly user_id = auth.uid())
      const { data: saves, error: savesErr } = await supabase
        .from('heritage_saves')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savesErr && savesErr.code !== 'PGRST116') {
        console.warn('Error fetching heritage saves:', savesErr);
      }

      // Query saved discussions
      const { data: discSaves } = await supabase
        .from('discussion_saves')
        .select(`*, topic:discussion_topics(*)`)
        .eq('user_id', user.id);

      const mappedSaves = (saves || []).map((s: any) => ({
        id: s.id,
        type: s.item_type,
        title: s.item_data?.title || 'Saved Item',
        description: s.item_data?.description || '',
        privacy: 'Private Vault',
        created_at: s.created_at,
      }));

      const mappedDiscSaves = (discSaves || []).map((ds: any) => ({
        id: ds.id,
        type: 'discussion',
        title: ds.topic?.title || 'Saved Discussion',
        description: ds.topic?.body || '',
        privacy: 'Private Vault',
        created_at: ds.created_at,
      }));

      return [...mappedSaves, ...mappedDiscSaves];
    },
    enabled: !!user?.id,
  });

  // Add personal note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('heritage_saves').insert({
        user_id: user.id,
        item_type: 'personal_note',
        item_id: `note-${Date.now()}`,
        item_data: { title, description: content },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-heritage-saves', user?.id] });
      toast.success('Personal heritage note saved to your private vault!');
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsAddingNote(false);
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save note'),
  });

  const handleDeleteItem = async (id: string, type: string) => {
    if (!user) return;
    try {
      if (type === 'discussion') {
        await supabase.from('discussion_saves').delete().eq('id', id).eq('user_id', user.id);
      } else {
        await supabase.from('heritage_saves').delete().eq('id', id).eq('user_id', user.id);
      }
      qc.invalidateQueries({ queryKey: ['my-heritage-saves', user?.id] });
      toast.success('Item removed from your vault.');
    } catch (e) {
      toast.error('Failed to remove item');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-umurage-card border border-umurage-border flex items-center justify-center mb-6">
          <Lock size={36} className="text-umurage-gold" />
        </div>
        <h2 className="font-cinzel text-2xl text-umurage-gold font-bold mb-3">{t('heritage.title')}</h2>
        <p className="text-umurage-muted text-base max-w-md mb-6 leading-relaxed">
          Create your private personal heritage vault — save family oral histories, bookmarked library content, ancestral notes, and museum records securely.
        </p>
        <div className="flex gap-3">
          <button onClick={() => openAuth('signup')} className="btn-gold px-6 py-3 font-bold">{t('auth.signup')}</button>
          <button onClick={() => openAuth('login')} className="btn-outline-gold px-6 py-3 font-bold">{t('auth.login')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock size={22} className="text-umurage-gold" />
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">{t('heritage.title')}</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800/40 font-semibold">
              STRICT PRIVATE RLS
            </span>
          </div>
          <p className="text-umurage-muted text-base">
            Your personal cultural heritage vault — strictly private to you unless explicitly shared.
          </p>
        </div>

        <button
          onClick={() => setIsAddingNote(!isAddingNote)}
          className="btn-gold text-xs px-4 py-2.5 flex items-center gap-1.5 font-bold shadow-md"
        >
          <Plus size={16} /> Add Personal Note
        </button>
      </div>

      {/* Add Note Card Form */}
      {isAddingNote && (
        <div className="umurage-card rounded-2xl p-5 mb-6 border border-umurage-gold/40 animate-fade-in space-y-3">
          <h3 className="font-cinzel text-amber-300 font-bold text-sm">Add Private Family / Ancestral Note</h3>
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="e.g. Clan Lineage Records of Abanyiginya"
            className="w-full bg-[#1e130a] border border-umurage-border rounded-xl px-3.5 py-2 text-xs text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/50"
          />
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Document ancestral names, oral memories, traditions passed down..."
            rows={4}
            className="w-full bg-[#1e130a] border border-umurage-border rounded-xl px-3.5 py-2 text-xs text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/50 resize-none leading-relaxed"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAddingNote(false)}
              className="px-4 py-2 rounded-xl text-xs border border-umurage-border text-umurage-muted hover:text-umurage-cream"
            >
              Cancel
            </button>
            <button
              onClick={() => addNoteMutation.mutate({ title: newNoteTitle, content: newNoteContent })}
              disabled={!newNoteTitle.trim() || addNoteMutation.isPending}
              className="btn-gold text-xs px-5 py-2 font-bold flex items-center gap-1.5"
            >
              {addNoteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />}
              Save Note to Vault
            </button>
          </div>
        </div>
      )}

      {/* Vault Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { title: 'Saved Library Items', icon: BookmarkCheck, count: savedItems.filter((i) => i.type !== 'personal_note').length, color: 'text-amber-400' },
          { title: 'Personal Notes & Family Records', icon: Users, count: savedItems.filter((i) => i.type === 'personal_note').length, color: 'text-purple-400' },
          { title: 'Private Vault Storage', icon: Lock, count: savedItems.length, color: 'text-green-400' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="umurage-card rounded-2xl p-5 border border-umurage-border flex items-center justify-between">
              <div>
                <Icon size={24} className={item.color} />
                <h3 className="text-umurage-cream font-semibold text-sm mt-2">{item.title}</h3>
                <p className="text-umurage-subtle text-[11px]">Strict user access only</p>
              </div>
              <span className="text-3xl font-bold font-cinzel text-umurage-gold">{item.count}</span>
            </div>
          );
        })}
      </div>

      {/* Saved Items Stream */}
      <h2 className="section-title mb-4">Your Private Heritage Collection</h2>

      {isLoading ? (
        <div className="flex justify-center py-12 text-umurage-muted text-xs">
          <Loader2 size={24} className="animate-spin text-umurage-gold mr-2" />
          Loading your private vault...
        </div>
      ) : savedItems.length === 0 ? (
        <div className="umurage-card rounded-2xl p-12 text-center border border-dashed border-umurage-border">
          <Lock size={40} className="text-umurage-gold/30 mx-auto mb-3" />
          <h3 className="text-umurage-cream font-semibold text-base mb-1">Your vault is currently empty</h3>
          <p className="text-umurage-muted text-xs max-w-sm mx-auto mb-5 leading-relaxed">
            Click "Save" on any Library resource, Oral History, or Discussion to add it to your private heritage vault.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedItems.map((item: any) => (
            <div key={item.id} className="umurage-card rounded-2xl p-4 border border-umurage-border flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-800/40">
                    {item.type}
                  </span>
                  <span className="text-[10px] text-purple-300 flex items-center gap-1">
                    <Lock size={10} /> Private
                  </span>
                </div>
                <h4 className="text-umurage-cream font-semibold text-sm leading-snug">{item.title}</h4>
                {item.description && (
                  <p className="text-umurage-muted text-xs line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDeleteItem(item.id, item.type)}
                  className="p-2 rounded-xl border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors"
                  title="Remove from Vault"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyHeritage;
