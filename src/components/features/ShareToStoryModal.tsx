import React, { useState } from 'react';
import { Share2, X, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ShareToStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioItem: {
    id: string;
    title: string;
    media_url: string;
    thumbnail_url?: string;
    storyteller_name?: string;
  };
}

export const ShareToStoryModal: React.FC<ShareToStoryModalProps> = ({ isOpen, onClose, audioItem }) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState(`Listening to "${audioItem.title}" on Umurage Oral History`);
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to share stories.');
      return;
    }

    setIsSharing(true);
    try {
      // Calculate 24 hour expiry date
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Insert story referencing existing media_url (no duplicate files)
      const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        type: 'audio',
        media_url: audioItem.media_url,
        caption: caption.trim(),
        expires_at: expiresAt,
      });

      if (error) throw error;

      toast.success('Oral history recording shared to your Story!');
      onClose();
    } catch (err: any) {
      console.error('Error sharing to story:', err);
      toast.error(err.message || 'Failed to share to story');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#1b120b] border border-[#5c3417] p-6 z-10 animate-fade-in text-amber-50">
        <button onClick={onClose} className="absolute top-4 right-4 text-amber-200/50 hover:text-amber-50">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-900/40 border border-amber-700/50 flex items-center justify-center">
            <Share2 size={18} className="text-amber-400" />
          </div>
          <div>
            <h3 className="font-cinzel text-lg text-amber-400 font-bold">Share to Story</h3>
            <p className="text-xs text-amber-200/60">Share this oral history with your followers for 24 hours.</p>
          </div>
        </div>

        {/* Audio Card Preview */}
        <div className="mb-4 p-4 rounded-xl bg-[#2b1a0c] border border-[#4a2a12] flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-950 flex items-center justify-center flex-shrink-0 border border-amber-700/40">
            <Volume2 size={20} className="text-amber-400 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-50 truncate">{audioItem.title}</p>
            <p className="text-xs text-amber-200/60 truncate">By {audioItem.storyteller_name || 'Elder Storyteller'}</p>
          </div>
        </div>

        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-amber-200/70 block mb-1">Story Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="Add your thoughts about this story..."
              className="w-full bg-[#221509] border border-[#4a2a12] rounded-xl px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400/60 resize-none"
            />
          </div>

          <div className="flex gap-2 text-[11px] text-amber-200/60 items-center">
            <Sparkles size={12} className="text-amber-400" />
            Original audio file is referenced directly without duplicating storage.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#4a2a12] text-xs text-amber-200/70 hover:text-amber-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSharing}
              className="flex-1 btn-gold py-2.5 text-xs flex items-center justify-center gap-2 font-bold"
            >
              {isSharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              Publish to Story
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
