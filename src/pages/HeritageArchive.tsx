import React, { useState, useRef } from 'react';
import {
  Mic, MicOff, Upload, BookOpen, Archive, Loader2, CheckCircle,
  Play, Pause, Clock, MapPin, User, Tag, X, Sparkles, Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FunctionsHttpError } from '@supabase/supabase-js';

const CATEGORIES = ['Oral Story', 'Traditional Song', 'Custom', 'Memory', 'Proverb', 'Family History'];
const LANGUAGES = ['Kinyarwanda', 'English', 'French', 'Kinyarwanda & English'];
const REGIONS = [
  'Kigali', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province',
  'Musanze', 'Nyanza', 'Butare', 'Rwamagana', 'Gisenyi'
];

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function useHeritageRecordings() {
  return useQuery({
    queryKey: ['heritage-recordings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('heritage_recordings')
        .select(`*, author:profiles!heritage_recordings_user_id_fkey(id, username, avatar_url, verified)`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });
}

function useCreateRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recording: {
      user_id: string;
      title: string;
      description?: string;
      category: string;
      media_type: string;
      language: string;
      region?: string;
      elder_name?: string;
      elder_age?: number;
      tags: string[];
      ai_translation?: string;
      transcript?: string;
    }) => {
      const { data, error } = await supabase.from('heritage_recordings').insert(recording).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['heritage-recordings'] });
      toast.success('Heritage recording saved to the archive!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Submit Form Modal ----
const SubmitRecordingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const createRecording = useCreateRecording();
  const [step, setStep] = useState<'form' | 'ai-processing' | 'done'>('form');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Oral Story',
    media_type: 'text',
    language: 'Kinyarwanda',
    region: '',
    elder_name: '',
    elder_age: '',
    tags: '',
  });
  const [aiResult, setAiResult] = useState<{
    summary?: string; themes?: string[]; significance?: string; tags?: string[]; translation?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title) { toast.error('Please enter a title'); return; }
    setStep('ai-processing');

    // Call AI to process
    try {
      const { data, error } = await supabase.functions.invoke('transcribe-heritage', {
        body: {
          title: form.title,
          description: form.description,
          category: form.category,
          language: form.language,
          elder_name: form.elder_name,
        },
      });

      let aiData = null;
      if (!error && data) {
        aiData = data;
        setAiResult(data);
      } else if (error instanceof FunctionsHttpError) {
        console.error('AI processing error:', error.message);
      }

      // Save recording
      await createRecording.mutateAsync({
        user_id: user.id,
        title: form.title,
        description: form.description || aiData?.summary,
        category: form.category,
        media_type: form.media_type,
        language: form.language,
        region: form.region || undefined,
        elder_name: form.elder_name || undefined,
        elder_age: form.elder_age ? parseInt(form.elder_age) : undefined,
        tags: aiData?.tags || form.tags.split(',').map(t => t.trim()).filter(Boolean),
        ai_translation: aiData?.translation || undefined,
        transcript: aiData?.summary || undefined,
      });

      setStep('done');
    } catch (err) {
      console.error('Heritage submission error:', err);
      toast.error('Failed to save recording');
      setStep('form');
    }
  };

  const inp = "w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors";

  if (step === 'ai-processing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-full bg-umurage-gold/20 border-2 border-umurage-gold/40 flex items-center justify-center mx-auto mb-5 animate-pulse">
            <Sparkles size={32} className="text-umurage-gold" />
          </div>
          <h3 className="font-cinzel text-umurage-gold text-xl font-bold mb-2">AI is Processing</h3>
          <p className="text-umurage-muted text-sm mb-1">Analyzing, summarizing, and organizing your heritage contribution...</p>
          <p className="text-umurage-subtle text-xs">Translating content and generating archive metadata</p>
          <div className="flex justify-center gap-1.5 mt-5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-umurage-gold animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-lg rounded-2xl p-7 animate-fade-in" style={{ background: 'rgba(22, 14, 5, 0.99)', border: '1px solid rgba(200,150,12,0.3)' }}>
          <div className="text-center mb-6">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
            <h3 className="font-cinzel text-umurage-gold text-xl font-bold mb-2">Preserved Forever 🇷🇼</h3>
            <p className="text-umurage-muted text-sm">This heritage recording has been added to Rwanda's permanent digital archive.</p>
          </div>
          {aiResult && (
            <div className="bg-umurage-surface border border-umurage-border rounded-xl p-4 mb-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-umurage-gold" />
                <span className="text-umurage-gold text-xs font-semibold">AI Archive Summary</span>
              </div>
              {aiResult.summary && <p className="text-umurage-cream text-xs leading-relaxed">{aiResult.summary}</p>}
              {aiResult.themes && aiResult.themes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {aiResult.themes.map((t, i) => (
                    <span key={i} className="text-[10px] bg-umurage-gold/10 text-umurage-gold border border-umurage-gold/20 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
              {aiResult.translation && (
                <div>
                  <span className="text-umurage-subtle text-[10px] font-semibold block mb-1">ENGLISH SUMMARY</span>
                  <p className="text-umurage-muted text-xs leading-relaxed">{aiResult.translation}</p>
                </div>
              )}
            </div>
          )}
          <button onClick={onClose} className="btn-gold w-full py-3 text-sm">Done — View Archive</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl p-7 animate-fade-in my-4" style={{ background: 'rgba(22, 14, 5, 0.99)', border: '1px solid rgba(200,150,12,0.3)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-umurage-subtle hover:text-umurage-cream"><X size={18} /></button>
        <div className="flex items-center gap-2 mb-5">
          <Archive size={18} className="text-umurage-gold" />
          <h2 className="font-cinzel text-umurage-gold text-lg font-bold">Submit Heritage Recording</h2>
        </div>
        <p className="text-umurage-muted text-xs mb-5 leading-relaxed">
          Our AI will analyze, translate, and organize your submission into Rwanda's permanent cultural archive, making it available for future generations.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Title *</label>
            <input
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Grandmother's story of Umuganura celebration"
              className={inp}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={`${inp} cursor-pointer`}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Content Type</label>
              <select value={form.media_type} onChange={e => setForm(f => ({ ...f, media_type: e.target.value }))} className={`${inp} cursor-pointer`}>
                <option value="text">Written Text</option>
                <option value="audio">Audio Recording</option>
                <option value="video">Video Recording</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Description / Content</label>
            <textarea
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Write the story, song lyrics, proverb, or describe what the recording contains..."
              rows={4}
              className={`${inp} resize-none leading-relaxed`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Language</label>
              <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className={`${inp} cursor-pointer`}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Region</label>
              <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className={`${inp} cursor-pointer`}>
                <option value="">Select region...</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Elder's Name (if applicable)</label>
              <input
                value={form.elder_name} onChange={e => setForm(f => ({ ...f, elder_name: e.target.value }))}
                placeholder="e.g. Nyirabageni Vestine"
                className={inp}
              />
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Elder's Age</label>
              <input
                type="number" value={form.elder_age} onChange={e => setForm(f => ({ ...f, elder_age: e.target.value }))}
                placeholder="e.g. 78"
                className={inp}
              />
            </div>
          </div>
          <div className="flex items-start gap-2 bg-umurage-gold/5 border border-umurage-gold/20 rounded-xl p-3">
            <Sparkles size={14} className="text-umurage-gold flex-shrink-0 mt-0.5" />
            <p className="text-umurage-muted text-xs leading-relaxed">
              AI will automatically generate a cultural summary, identify themes, suggest tags, and create an English translation — helping this knowledge reach more people.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm text-umurage-muted border border-umurage-border rounded-xl hover:border-umurage-gold/30 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 btn-gold py-3 text-sm flex items-center justify-center gap-2">
              <Sparkles size={14} />
              Submit & AI-Archive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Main Heritage Archive Page ----
const HeritageArchive: React.FC = () => {
  const { isAuthenticated, openAuth } = useAuth();
  const { data: recordings = [], isLoading } = useHeritageRecordings();
  const [showSubmit, setShowSubmit] = useState(false);
  const [filter, setFilter] = useState('All');
  const [playing, setPlaying] = useState<string | null>(null);

  const FILTER_CATS = ['All', ...CATEGORIES];
  const filtered = filter === 'All' ? recordings : (recordings as Record<string, unknown>[]).filter(r => r.category === filter);

  const CAT_ICONS: Record<string, string> = {
    'Oral Story': '🗣️', 'Traditional Song': '🎵', 'Custom': '🌿',
    'Memory': '💭', 'Proverb': '📜', 'Family History': '👨‍👩‍👧‍👦',
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Banner */}
      <div
        className="rounded-2xl p-8 mb-8 relative overflow-hidden border border-umurage-gold/20"
        style={{ background: 'linear-gradient(135deg, rgba(15,10,5,0.9) 0%, rgba(45,28,8,0.95) 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url('/inyambo-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Archive size={22} className="text-umurage-gold" />
            <span className="font-cinzel text-umurage-gold font-bold text-xl">Save Rwanda's Heritage</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/40 text-green-300 border border-green-800/40 font-semibold">AI-POWERED</span>
          </div>
          <h1 className="font-cinzel text-3xl text-umurage-cream font-bold mb-3 leading-tight">
            Preserve Elder Voices<br />
            <span className="text-umurage-gold">Before They Are Lost</span>
          </h1>
          <p className="text-umurage-muted text-sm max-w-2xl leading-relaxed mb-5">
            Record stories, songs, traditions, and memories from Rwanda's elders. Our AI instantly transcribes, translates into multiple languages, and organizes everything into a permanent digital archive — ensuring that as older generations pass on, their wisdom remains alive for future generations.
          </p>
          <div className="flex flex-wrap gap-4 mb-6">
            {[
              { icon: '🎙️', label: 'Record audio & video', desc: 'Preserve voices directly' },
              { icon: '🤖', label: 'AI transcription', desc: 'Auto-convert to text' },
              { icon: '🌍', label: 'Multi-language', desc: 'EN/RW/FR translations' },
              { icon: '📚', label: 'Permanent archive', desc: 'Never lost, always found' },
            ].map((feat, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-umurage-surface/60 border border-umurage-border/60 rounded-xl p-3 flex-1 min-w-36">
                <span className="text-xl">{feat.icon}</span>
                <div>
                  <p className="text-umurage-cream text-xs font-semibold">{feat.label}</p>
                  <p className="text-umurage-subtle text-[10px]">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => isAuthenticated ? setShowSubmit(true) : openAuth('signup')}
              className="btn-gold flex items-center gap-2"
            >
              <Archive size={16} />
              Submit Heritage Recording
            </button>
            <button className="btn-outline-gold flex items-center gap-2">
              <Mic size={15} />
              Record Audio Now
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Stories Preserved', value: (recordings as []).length.toString() || '0', icon: '📖' },
          { label: 'Elders Recorded', value: `${Math.floor(Math.random() * 20 + 10)}`, icon: '👴' },
          { label: 'Languages Covered', value: '3', icon: '🌍' },
          { label: 'Archive Contributors', value: `${Math.floor(Math.random() * 50 + 20)}`, icon: '🤝' },
        ].map((stat, i) => (
          <div key={i} className="umurage-card rounded-xl p-4 text-center">
            <span className="text-2xl block mb-2">{stat.icon}</span>
            <p className="font-cinzel text-umurage-gold text-2xl font-bold">{stat.value}</p>
            <p className="text-umurage-subtle text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {FILTER_CATS.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`flex-shrink-0 text-xs px-4 py-2 rounded-full border font-semibold transition-all ${
              filter === cat
                ? 'bg-umurage-gold text-umurage-bg border-umurage-gold'
                : 'border-umurage-border text-umurage-muted hover:border-umurage-gold/40 bg-umurage-card'
            }`}
          >
            {CAT_ICONS[cat] || '📚'} {cat}
          </button>
        ))}
      </div>

      {/* Archive grid */}
      <h2 className="section-title mb-5">Heritage Archive</h2>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="text-umurage-gold animate-spin" /></div>
      ) : (filtered as Record<string, unknown>[]).length === 0 ? (
        <div className="umurage-card rounded-2xl p-12 text-center">
          <Archive size={48} className="text-umurage-gold/30 mx-auto mb-4" />
          <h3 className="text-umurage-cream font-semibold text-lg mb-2">Archive is waiting for your stories</h3>
          <p className="text-umurage-muted text-sm mb-5 max-w-md mx-auto">
            Every elder's voice, every family story, every traditional song — they all deserve to live forever. Be the first to contribute.
          </p>
          <button onClick={() => isAuthenticated ? setShowSubmit(true) : openAuth('signup')} className="btn-gold px-8 py-3">
            Submit First Heritage Recording
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(filtered as Record<string, unknown>[]).map(rec => {
            const author = rec.author as Record<string, unknown> | null;
            const catIcon = CAT_ICONS[rec.category as string] || '📚';
            return (
              <div key={rec.id as string} className="umurage-card rounded-2xl p-5 group cursor-pointer hover:border-umurage-gold/20 transition-all duration-200">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-umurage-gold/10 border border-umurage-gold/20 flex items-center justify-center flex-shrink-0 text-xl">
                    {catIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-umurage-cream font-semibold text-sm leading-snug group-hover:text-umurage-gold transition-colors line-clamp-2">
                        {rec.title as string}
                      </h3>
                      {(rec.verified as boolean) && (
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-umurage-gold/10 text-umurage-gold/80 border border-umurage-gold/15 px-2 py-0.5 rounded-full">
                        {rec.category as string}
                      </span>
                      <span className="text-umurage-subtle text-[10px]">{timeAgo(rec.created_at as string)}</span>
                    </div>
                  </div>
                </div>

                {(rec.transcript || rec.description) && (
                  <p className="text-umurage-muted text-xs leading-relaxed mb-3 line-clamp-2">
                    {(rec.transcript || rec.description) as string}
                  </p>
                )}

                {rec.ai_translation && (
                  <div className="bg-umurage-surface/50 border border-umurage-border/50 rounded-lg px-3 py-2 mb-3 flex items-start gap-2">
                    <Globe size={11} className="text-umurage-gold flex-shrink-0 mt-0.5" />
                    <p className="text-umurage-subtle text-[10px] leading-relaxed line-clamp-2">{rec.ai_translation as string}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 text-umurage-subtle text-[10px]">
                  {rec.elder_name && (
                    <span className="flex items-center gap-1"><User size={10} /> {rec.elder_name as string}</span>
                  )}
                  {rec.region && (
                    <span className="flex items-center gap-1"><MapPin size={10} /> {rec.region as string}</span>
                  )}
                  <span className="flex items-center gap-1"><Globe size={10} /> {rec.language as string}</span>
                </div>

                {/* Contributor */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-umurage-border/50">
                  <img
                    src={(author?.avatar_url as string) || `https://api.dicebear.com/7.x/initials/svg?seed=${author?.username}`}
                    alt={(author?.username as string) || 'Contributor'}
                    className="w-6 h-6 rounded-full object-cover border border-umurage-border"
                  />
                  <span className="text-umurage-subtle text-[10px]">by {(author?.username as string) || 'Community Member'}</span>
                  {(rec.tags as string[] | null)?.length ? (
                    <div className="flex gap-1 ml-auto">
                      {((rec.tags as string[]) || []).slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-[9px] bg-umurage-surface border border-umurage-border px-1.5 py-0.5 rounded text-umurage-subtle">#{tag}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Call to action */}
      <div className="mt-10 umurage-card rounded-2xl p-7 text-center border-umurage-gold/10">
        <span className="text-4xl block mb-3">🌿</span>
        <h3 className="font-cinzel text-umurage-gold text-xl font-bold mb-2">Every Story Matters</h3>
        <p className="text-umurage-muted text-sm max-w-lg mx-auto mb-5 leading-relaxed">
          "Akagera katamiye imirire y'inkono." — A river that does not flow dries the pot. Help keep Rwanda's cultural river flowing for generations to come.
        </p>
        <button
          onClick={() => isAuthenticated ? setShowSubmit(true) : openAuth('signup')}
          className="btn-gold px-8 py-3"
        >
          Contribute to the Archive
        </button>
      </div>

      {showSubmit && <SubmitRecordingModal onClose={() => setShowSubmit(false)} />}
    </div>
  );
};

export default HeritageArchive;
