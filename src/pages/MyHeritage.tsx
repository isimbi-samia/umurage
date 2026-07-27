import React from 'react';
import { Heart, BookmarkCheck, Users, Camera, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const MyHeritage: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, openAuth } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-umurage-card border border-umurage-border flex items-center justify-center mb-6">
          <Heart size={36} className="text-umurage-gold" />
        </div>
        <h2 className="font-cinzel text-2xl text-umurage-gold font-bold mb-3">{t('heritage.title')}</h2>
        <p className="text-umurage-muted text-base max-w-md mb-6 leading-relaxed">
          Create your personal heritage profile — save family stories, photos, memories, and ancestral information to preserve for future generations.
        </p>
        <div className="flex gap-3">
          <button onClick={() => openAuth('signup')} className="btn-gold px-6 py-3">{t('auth.signup')}</button>
          <button onClick={() => openAuth('login')} className="btn-outline-gold px-6 py-3">{t('auth.login')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-cinzel text-3xl text-umurage-gold font-bold mb-2">{t('heritage.title')}</h1>
        <p className="text-umurage-muted text-base">Your personal cultural heritage vault — preserve your family's stories, memories, and history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {[
          { title: 'Family Stories', icon: Users, count: 0, desc: 'Add family narratives and ancestral memories', color: 'umurage-gold' },
          { title: 'Saved Content', icon: BookmarkCheck, count: 3, desc: 'Content you\'ve bookmarked from the library', color: 'blue-400' },
          { title: 'Family Photos', icon: Camera, count: 0, desc: 'Historical photos and family memories', color: 'purple-400' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="umurage-card rounded-2xl p-6 cursor-pointer group hover:border-umurage-gold/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <Icon size={24} className={`text-${item.color}`} />
                <span className={`text-2xl font-bold font-cinzel text-${item.color}`}>{item.count}</span>
              </div>
              <h3 className="text-umurage-cream font-semibold mb-1 group-hover:text-umurage-gold transition-colors">{item.title}</h3>
              <p className="text-umurage-muted text-sm leading-relaxed mb-4">{item.desc}</p>
              <button className="flex items-center gap-1.5 text-umurage-gold text-sm font-medium hover:text-umurage-gold-light transition-colors">
                <Plus size={14} />
                Add {item.title}
              </button>
            </div>
          );
        })}
      </div>

      {/* Family tree placeholder */}
      <div className="umurage-card rounded-2xl p-8 text-center border-dashed" style={{ borderColor: 'rgba(200,150,12,0.3)' }}>
        <span className="text-5xl block mb-4">🌳</span>
        <h3 className="font-cinzel text-umurage-gold font-bold text-xl mb-2">Family Heritage Tree</h3>
        <p className="text-umurage-muted text-sm max-w-md mx-auto mb-6 leading-relaxed">
          Build your family heritage tree — connect generations, document ancestral origins, and create a living digital legacy for your descendants.
        </p>
        <button className="btn-gold px-8 py-3">Start Your Heritage Tree</button>
      </div>
    </div>
  );
};

export default MyHeritage;
