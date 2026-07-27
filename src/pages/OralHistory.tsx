import React from 'react';
import { Mic, Play, Headphones, Clock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const ORAL_RECORDS = [
  { id: 1, title: "The Sacred Inyambo Cattle — Royal Traditions", elder: "Nyirabageni Vestine", region: "Nyanza", duration: "18:42", date: "2025-01-15", verified: true, avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=60&h=60&fit=crop&crop=face", thumbnail: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=120&h=80&fit=crop" },
  { id: 2, title: "Inkuru ya Gihanga — The First King of Rwanda", elder: "Emmanuel Ntezimana", region: "Northern Province", duration: "24:15", date: "2025-02-08", verified: true, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face", thumbnail: "https://images.unsplash.com/photo-1516307365426-bea591f05011?w=120&h=80&fit=crop" },
  { id: 3, title: "Wedding Songs and Ceremonies of the Eastern Province", elder: "Immaculée Mukashyaka", region: "Eastern Province", duration: "31:08", date: "2025-03-22", verified: false, avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=60&h=60&fit=crop&crop=face", thumbnail: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=120&h=80&fit=crop" },
  { id: 4, title: "Proverbs of the Hills — Inzira yo Gutura", elder: "Bernard Habimana", region: "Southern Province", duration: "15:33", date: "2025-04-10", verified: false, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face", thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=120&h=80&fit=crop" },
];

const OralHistory: React.FC = () => {
  const { isAuthenticated, openAuth } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center">
            <Mic size={20} className="text-purple-400" />
          </div>
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">{t('nav.oral')}</h1>
        </div>
        <p className="text-umurage-muted text-base ml-13">
          Preserving elder voices, community memories, and oral traditions before they are lost forever.
        </p>
      </div>

      {/* Record CTA */}
      {isAuthenticated ? (
        <div
          className="rounded-2xl p-6 mb-8 border border-purple-800/30 flex items-center gap-5"
          style={{ background: 'rgba(88, 28, 135, 0.1)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-800/30 border border-purple-700/40 flex items-center justify-center flex-shrink-0">
            <Mic size={28} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-umurage-cream font-semibold text-lg mb-1">Record an Oral History</h3>
            <p className="text-umurage-muted text-sm">Have an elder story or community memory? Record and upload it to preserve it forever.</p>
          </div>
          <button className="btn-gold px-6 py-3 flex-shrink-0">Start Recording</button>
        </div>
      ) : (
        <div className="umurage-card rounded-2xl p-6 mb-8 text-center border border-umurage-border">
          <Mic size={32} className="text-umurage-gold mx-auto mb-3" />
          <h3 className="text-umurage-cream font-semibold mb-2">Contribute Oral Histories</h3>
          <p className="text-umurage-muted text-sm mb-4">Join Umurage Hub to record and share elder stories and community memories.</p>
          <button onClick={() => openAuth('signup')} className="btn-gold px-6 py-2">
            {t('auth.signup')}
          </button>
        </div>
      )}

      {/* Archive */}
      <h2 className="section-title mb-5">Oral History Archive</h2>
      <div className="space-y-4">
        {ORAL_RECORDS.map(record => (
          <div key={record.id} className="umurage-card rounded-2xl p-5 flex gap-4 group cursor-pointer">
            <img src={record.thumbnail} alt={record.title} className="w-28 h-20 rounded-xl object-cover flex-shrink-0 group-hover:scale-[1.02] transition-transform" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-umurage-cream font-semibold text-base leading-snug group-hover:text-umurage-gold transition-colors">{record.title}</h3>
                <button className="w-10 h-10 rounded-full bg-umurage-gold/20 border border-umurage-gold/30 flex items-center justify-center hover:bg-umurage-gold/30 transition-colors flex-shrink-0">
                  <Play size={14} className="text-umurage-gold ml-0.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <img src={record.avatar} alt={record.elder} className="w-5 h-5 rounded-full object-cover" />
                <span className="text-umurage-muted text-xs">{record.elder}</span>
                {record.verified && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-umurage-verified/20 text-green-400 border border-green-800/40">Verified</span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-umurage-subtle text-xs"><User size={10} />{record.region}</span>
                <span className="flex items-center gap-1 text-umurage-subtle text-xs"><Clock size={10} />{record.duration}</span>
                <span className="flex items-center gap-1 text-umurage-subtle text-xs"><Headphones size={10} />Audio</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OralHistory;
