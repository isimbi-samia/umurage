import React, { useState } from 'react';
import { BookmarkCheck, Users, Lock, Plus, FolderPlus, Trash2, Loader2, Video, Image, FileText, Mic, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadMediaToStorage } from '@/lib/uploadMedia';
import { toast } from 'sonner';

export const MyHeritage: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user, openAuth } = useAuth();
  const qc = useQueryClient();

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemType, setItemType] = useState<'personal_note' | 'image' | 'video' | 'audio' | 'article'>('personal_note');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  // Fetch private saved items for the authenticated user only (user_id = auth.uid())
  const { data: savedItems = [], isLoading } = useQuery({
    queryKey: ['my-heritage-saves', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: saves, error: savesErr } = await supabase
        .from('heritage_saves')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savesErr && savesErr.code !== 'PGRST116') {
        console.warn('Error fetching heritage saves:', savesErr);
      }

      return (saves || []).map((s: any) => ({
        id: s.id,
        type: s.item_type,
        title: s.item_data?.title || 'Private Item',
        description: s.item_data?.description || '',
        mediaUrl: s.item_data?.media_url || null,
        created_at: s.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  // Add personal item mutation
  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!newTitle.trim()) throw new Error('Please enter a title');

      let mediaUrl: string | null = null;
      if (mediaFile) {
        const fileKind = itemType === 'video' ? 'video' : itemType === 'audio' ? 'audio' : 'image';
        const res = await uploadMediaToStorage(mediaFile, fileKind, user.id, 'my_heritage');
        mediaUrl = res.url;
      }

      const { data, error } = await supabase.from('heritage_saves').insert({
        user_id: user.id,
        item_type: itemType,
        item_id: `vault-${Date.now()}`,
        item_data: { title: newTitle.trim(), description: newDescription.trim(), media_url: mediaUrl },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-heritage-saves', user?.id] });
      toast.success('Family heritage item saved to your private vault!');
      setNewTitle('');
      setNewDescription('');
      setMediaFile(null);
      setIsAddingItem(false);
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save item'),
  });

  const handleDeleteItem = async (id: string) => {
    if (!user) return;
    try {
      await supabase.from('heritage_saves').delete().eq('id', id).eq('user_id', user.id);
      qc.invalidateQueries({ queryKey: ['my-heritage-saves', user?.id] });
      toast.success('Item removed from vault.');
    } catch (e) {
      toast.error('Failed to remove item');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock size={48} className="text-umurage-gold mb-4" />
        <h2 className="font-cinzel text-2xl text-umurage-gold font-bold mb-2">{t('heritage.title')}</h2>
        <p className="text-umurage-muted text-sm max-w-md mb-6">
          Create your private personal heritage vault — save family memories, videos, images, articles, and oral history records securely.
        </p>
        <button onClick={() => openAuth('login')} className="btn-gold px-6 py-2.5 font-bold">Sign In to Open Vault</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock size={24} className="text-umurage-gold" />
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">{t('heritage.title')}</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800/40 font-bold">STRICT PRIVATE RLS</span>
          </div>
          <p className="text-umurage-muted text-sm">Save family oral memories, ancestral photos, cultural videos, and notes securely.</p>
        </div>

        <button onClick={() => setIsAddingItem(!isAddingItem)} className="btn-gold text-xs px-4 py-2.5 flex items-center gap-1.5 font-bold shadow-md">
          <Plus size={16} /> Add Vault Item
        </button>
      </div>

      {/* Add Heritage Item Form */}
      {isAddingItem && (
        <div className="umurage-card rounded-2xl p-5 border border-umurage-gold/40 space-y-4 animate-fade-in">
          <h3 className="font-cinzel text-amber-300 font-bold text-sm">Add Private Family Heritage Record</h3>

          <div className="grid grid-cols-5 gap-2">
            {[
              { key: 'personal_note', label: 'Note', icon: FileText },
              { key: 'image', label: 'Image', icon: Image },
              { key: 'video', label: 'Video', icon: Video },
              { key: 'audio', label: 'Audio', icon: Mic },
              { key: 'article', label: 'Article', icon: BookmarkCheck },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = itemType === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setItemType(t.key as any)}
                  className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 ${
                    isSelected ? 'bg-amber-900/50 text-amber-300 border-amber-500' : 'bg-[#18110a] border-[#4a2e16] text-umurage-muted'
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Item Title (e.g. Grandfather's Royal Drum Chants)"
            className="w-full bg-[#1e130a] border border-[#4a2e16] rounded-xl px-3.5 py-2 text-xs text-umurage-cream"
          />

          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Record memories, ancestral details, or context..."
            rows={3}
            className="w-full bg-[#1e130a] border border-[#4a2e16] rounded-xl px-3.5 py-2 text-xs text-umurage-cream resize-none"
          />

          {(itemType === 'image' || itemType === 'video' || itemType === 'audio') && (
            <div>
              <label className="text-xs font-semibold text-amber-300 block mb-1">Upload Media File ({itemType})</label>
              <input
                type="file"
                accept={itemType === 'image' ? 'image/*' : itemType === 'video' ? 'video/*' : 'audio/*'}
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                className="text-xs text-amber-200/80"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsAddingItem(false)} className="px-4 py-2 rounded-xl text-xs border border-[#4a2e16] text-umurage-muted">Cancel</button>
            <button onClick={() => addItemMutation.mutate()} disabled={addItemMutation.isPending} className="btn-gold text-xs px-5 py-2 font-bold flex items-center gap-1.5">
              {addItemMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />} Save to Vault
            </button>
          </div>
        </div>
      )}

      {/* Vault Items Stream */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-umurage-gold" /></div>
      ) : savedItems.length === 0 ? (
        <div className="umurage-card rounded-2xl p-12 text-center border border-dashed border-umurage-border">
          <Lock size={40} className="text-umurage-gold/30 mx-auto mb-3" />
          <h3 className="text-umurage-cream font-semibold text-base mb-1">Your vault is empty</h3>
          <p className="text-umurage-muted text-xs max-w-sm mx-auto">Add private family memories, photos, videos, and oral history records above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedItems.map((item: any) => (
            <div key={item.id} className="umurage-card rounded-2xl p-4 border border-umurage-border flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-800/40">
                    {item.type}
                  </span>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 p-1 hover:bg-red-950/30 rounded"><Trash2 size={14} /></button>
                </div>

                <h4 className="text-umurage-cream font-semibold text-sm leading-snug">{item.title}</h4>
                {item.description && <p className="text-umurage-muted text-xs line-clamp-3 mt-1">{item.description}</p>}

                {item.mediaUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-[#4a2e16]">
                    {item.type === 'video' ? (
                      <video src={item.mediaUrl} controls className="w-full h-40 object-cover" />
                    ) : item.type === 'audio' ? (
                      <audio src={item.mediaUrl} controls className="w-full p-2" />
                    ) : (
                      <img src={item.mediaUrl} alt={item.title} className="w-full h-40 object-cover" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyHeritage;
