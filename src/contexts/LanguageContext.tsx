import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type LangCode = 'en' | 'rw' | 'fr' | 'sw';

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string) => string;
}

const translations: Record<LangCode, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.library': 'Library',
    'nav.stories': 'Stories',
    'nav.oral': 'Oral History',
    'nav.map': 'Cultural Map',
    'nav.discussions': 'Discussions',
    'nav.events': 'Events',
    'nav.marketplace': 'Marketplace',
    'nav.courses': 'Courses',
    'nav.heritage': 'My Heritage',
    'nav.archive': 'Heritage Archive',
    'nav.verify': 'Get Verified',
    'nav.ai': 'AI Cultural Guide',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',

    // Titles
    'ai.title': 'AI Cultural Guide',
    'ai.subtitle': 'Ask anything about Rwandan culture, history, language, or royal traditions.',
    'ai.placeholder': 'Ask anything about Rwandan culture...',
    'discussions.title': 'Community Discussions',
    'library.title': 'Cultural Library',
    'courses.title': 'Cultural Courses & Leadership',
    'heritage.title': 'My Heritage Vault',
    'marketplace.title': 'Made-in-Rwanda Marketplace',
    'oral.title': 'Oral History & Elder Stories',
    'map.title': 'Interactive Cultural Map',
    'events.title': 'Cultural Events',

    // Search & Actions
    'search.placeholder': 'Search culture, stories, books, videos...',
    'follow': 'Follow',
    'following.btn': 'Following',
    'save': 'Save',
    'saved': 'Saved',
    'like': 'Like',
    'liked': 'Liked',
    'comment': 'Comment',
    'share': 'Share',
    'upload': 'Upload',
    'edit': 'Edit',
    'delete': 'Delete',
    'cancel': 'Cancel',
    'submit': 'Submit',
    'back': 'Back',
    'close': 'Close',

    // Auth & Misc
    'auth.login': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Log Out',
    'settings.title': 'Settings',
    'settings.language': 'Language',
  },

  rw: {
    // Navigation
    'nav.home': 'Ahabanza',
    'nav.library': 'Isomero',
    'nav.stories': 'Inkuru z\'Iminota 24',
    'nav.oral': 'Ubuhamya bw\'Inararibonye',
    'nav.map': 'Ikarita y\'Umuco',
    'nav.discussions': 'Ibiganiro',
    'nav.events': 'Ibirori n\'Ibyabaye',
    'nav.marketplace': 'Isoko y\'Umuco',
    'nav.courses': 'Amasomo y\'Umuco',
    'nav.heritage': 'Urumuri Rwanjye',
    'nav.archive': 'Ububiko bw\'Umuco',
    'nav.verify': 'Kubona Ikirango',
    'nav.ai': 'Umuyobozi w\'Umuco AI',
    'nav.settings': 'Igenamiterere',
    'nav.profile': 'Umwirondoro',
    'nav.messages': 'Ubutumwa',
    'nav.notifications': 'Ibyimenyeshejo',

    // Titles
    'ai.title': 'Umuyobozi w\'Umuco AI',
    'ai.subtitle': 'Baza ikintu cyose ku muco, amateka, ururimi n\'imiziro y\'u Rwanda.',
    'ai.placeholder': 'Baza ikintu cyose ku muco...',
    'discussions.title': 'Ibiganiro vy\'Umuryango',
    'library.title': 'Isomero ry\'Umuco',
    'courses.title': 'Amasomo y\'Umuco n\'Ubuyobozi',
    'heritage.title': 'Ububiko bw\'Urumuri Rwanjye',
    'marketplace.title': 'Isoko y\'Umuco no Gakondo',
    'oral.title': 'Ubuhamya bw\'Inararibonye n\'Amateka',
    'map.title': 'Ikarita y\'Umuco n\'Amateka',
    'events.title': 'Ibirori by\'Umuco',

    // Search & Actions
    'search.placeholder': 'Shakisha umuco, inkuru, ibitabo, amashusho...',
    'follow': 'Kurikira',
    'following.btn': 'Urakurikira',
    'save': 'Bika',
    'saved': 'Yabitswe',
    'like': 'Kunda',
    'liked': 'Yakunzwe',
    'comment': 'Tanga Igitekerezo',
    'share': 'Sangiza',
    'upload': 'Shyiraho',
    'edit': 'Hindura',
    'delete': 'Siba',
    'cancel': 'Kanseri',
    'submit': 'Ohereza',
    'back': 'Subira Inyuma',
    'close': 'Funga',

    // Auth & Misc
    'auth.login': 'Injira',
    'auth.signup': 'Iyandikishe',
    'auth.logout': 'Sohoka',
    'settings.title': 'Igenamiterere',
    'settings.language': 'Ururimi',
  },

  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.library': 'Bibliothèque',
    'nav.stories': 'Histoires 24h',
    'nav.oral': 'Histoire Orale',
    'nav.map': 'Carte Culturelle',
    'nav.discussions': 'Discussions',
    'nav.events': 'Événements',
    'nav.marketplace': 'Marché Culturel',
    'nav.courses': 'Cours Culturels',
    'nav.heritage': 'Mon Patrimoine',
    'nav.archive': 'Archives du Patrimoine',
    'nav.verify': 'Obtenir la Vérification',
    'nav.ai': 'Guide Culturel IA',
    'nav.settings': 'Paramètres',
    'nav.profile': 'Profil',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',

    // Titles
    'ai.title': 'Guide Culturel IA',
    'ai.subtitle': 'Posez des questions sur la culture, l\'histoire, la langue et les traditions.',
    'ai.placeholder': 'Posez votre question sur la culture...',
    'discussions.title': 'Discussions Communautaires',
    'library.title': 'Bibliothèque Culturelle',
    'courses.title': 'Cours Culturels et Leadership',
    'heritage.title': 'Mon Coffre du Patrimoine',
    'marketplace.title': 'Marché Culturel Made-in-Rwanda',
    'oral.title': 'Histoire Orale et Récits des Aînés',
    'map.title': 'Carte Culturelle Interactive',
    'events.title': 'Événements Culturels',

    // Search & Actions
    'search.placeholder': 'Rechercher culture, histoires, livres, vidéos...',
    'follow': 'Suivre',
    'following.btn': 'Abonné',
    'save': 'Enregistrer',
    'saved': 'Enregistré',
    'like': 'J\'aime',
    'liked': 'Aimé',
    'comment': 'Commenter',
    'share': 'Partager',
    'upload': 'Téléverser',
    'edit': 'Modifier',
    'delete': 'Supprimer',
    'cancel': 'Annuler',
    'submit': 'Soumettre',
    'back': 'Retour',
    'close': 'Fermer',

    // Auth & Misc
    'auth.login': 'Se Connecter',
    'auth.signup': 'S\'inscrire',
    'auth.logout': 'Déconnexion',
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
  },

  sw: {
    // Navigation
    'nav.home': 'Nyumbani',
    'nav.library': 'Maktaba',
    'nav.stories': 'Hadithi za Masaa 24',
    'nav.oral': 'Historia ya Mdomo',
    'nav.map': 'Ramani ya Utamaduni',
    'nav.discussions': 'Majadiliano',
    'nav.events': 'Matukio',
    'nav.marketplace': 'Soko la Utamaduni',
    'nav.courses': 'Kozi za Utamaduni',
    'nav.heritage': 'Urithi Wangu',
    'nav.archive': 'Kumbukumbu za Urithi',
    'nav.verify': 'Pata Uthibitisho',
    'nav.ai': 'Mwongozo wa Utamaduni wa AI',
    'nav.settings': 'Mipangilio',
    'nav.profile': 'Profaili',
    'nav.messages': 'Ujumbe',
    'nav.notifications': 'Arifa',

    // Titles
    'ai.title': 'Mwongozo wa Utamaduni wa AI',
    'ai.subtitle': 'Uliza chochote kuhusu utamaduni, historia, na lugha ya Rwanda.',
    'ai.placeholder': 'Uliza kuhusu utamaduni...',
    'discussions.title': 'Majadiliano ya Jamii',
    'library.title': 'Maktaba ya Utamaduni',
    'courses.title': 'Kozi za Utamaduni na Uongozi',
    'heritage.title': 'Hifadhi ya Urithi Wangu',
    'marketplace.title': 'Soko la Utamaduni wa Rwanda',
    'oral.title': 'Historia ya Mdomo',
    'map.title': 'Ramani ya Utamaduni',
    'events.title': 'Matukio ya Utamaduni',

    // Search & Actions
    'search.placeholder': 'Tafuta utamaduni, hadithi, vitabu, video...',
    'follow': 'Fuata',
    'following.btn': 'Unamfuata',
    'save': 'Hifadhi',
    'saved': 'Imehifadhiwa',
    'like': 'Penda',
    'liked': 'Imependwa',
    'comment': 'Maoni',
    'share': 'Shiriki',
    'upload': 'Pakia',
    'edit': 'Hariri',
    'delete': 'Futa',
    'cancel': 'Ghairi',
    'submit': 'Wasilisha',
    'back': 'Rudi',
    'close': 'Funga',

    // Auth & Misc
    'auth.login': 'Ingia',
    'auth.signup': 'Jiandikishe',
    'auth.logout': 'Ondoka',
    'settings.title': 'Mipangilio',
    'settings.language': 'Lugha',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<LangCode>(() => {
    try {
      const stored = localStorage.getItem('umurage-lang');
      if (stored && ['en', 'rw', 'fr', 'sw'].includes(stored)) return stored as LangCode;
    } catch {
      /* ignore storage errors */
    }
    return 'en';
  });

  const setLang = (newLang: LangCode) => {
    setLangState(newLang);
    try {
      localStorage.setItem('umurage-lang', newLang);
    } catch {
      /* ignore storage errors */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string): string => {
    return translations[lang][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
