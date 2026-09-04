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
    'nav.upload': 'Upload',

    // Feed Tabs & Sort
    'feed.forYou': 'For You',
    'feed.following': 'Following',
    'feed.explore': 'Explore',
    'feed.latest': 'Latest',
    'feed.popular': 'Most Popular',
    'feed.trending': 'Trending',
    'feed.noFollowing': 'No posts from accounts you follow',
    'feed.noPosts': 'No posts yet',

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

    // Notifications
    'notif.title': 'Notifications',
    'notif.markAllRead': 'Mark all as read',
    'notif.noNotifs': 'No notifications yet',

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
    'poweredBy': 'Umurage Hub © 2026',

    // Events & Marketplace Phase 4
    'events.emptyTitle': 'No upcoming cultural events have been added yet.',
    'events.emptySubtitle': 'Be the first to share a cultural gathering or festival with the community.',
    'events.createBtn': 'Create an Event',
    'marketplace.emptyTitle': 'No cultural products have been listed yet.',
    'marketplace.emptySubtitle': 'Support Rwandan cultural artisans and traditional creators.',
    'marketplace.startSelling': 'Become a Seller',
    'marketplace.listProduct': 'List Product',
    'marketplace.payOnDelivery': 'Pay on Delivery',
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
    'nav.upload': 'Ohereza',

    // Feed Tabs & Sort
    'feed.forYou': 'Ibyakugenerwa',
    'feed.following': 'Abo Ukurikira',
    'feed.explore': 'Vumbura',
    'feed.latest': 'Ibiheruka',
    'feed.popular': 'Bikunzwe Cyane',
    'feed.trending': 'Bigezweho',
    'feed.noFollowing': 'Nta makuru y\'abo ukurikira arahagera',
    'feed.noPosts': 'Nta nkuru zirahashyirwa',

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

    // Notifications
    'notif.title': 'Ibyimenyeshejo',
    'notif.markAllRead': 'Soma byose',
    'notif.noNotifs': 'Nta byimenyeshejo bihari',

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
    'upload': 'Ohereza',
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
    'poweredBy': 'Umurage Hub © 2026',

    // Events & Marketplace Phase 4
    'events.emptyTitle': 'Nta birori by\'umuco birahagera.',
    'events.emptySubtitle': 'Ba uwa mbere gusangiza umuryango ibirori cyangwa iserukiramuco.',
    'events.createBtn': 'Kurema Ibyabaye',
    'marketplace.emptyTitle': 'Nta bintu by\'umuco birashyirwa mu isoko.',
    'marketplace.emptySubtitle': 'Shyigikira abakora ibihangano gakondo n\'abanyamuga b\'u Rwanda.',
    'marketplace.startSelling': 'Ba Umugurisha',
    'marketplace.listProduct': 'Shyiraho Igihangano',
    'marketplace.payOnDelivery': 'Kwishura Umaze Kwakira',
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
    'nav.upload': 'Publier',

    // Feed Tabs & Sort
    'feed.forYou': 'Pour Vous',
    'feed.following': 'Abonnements',
    'feed.explore': 'Explorer',
    'feed.latest': 'Plus récents',
    'feed.popular': 'Plus populaires',
    'feed.trending': 'Tendances',
    'feed.noFollowing': 'Aucune publication de vos abonnements',
    'feed.noPosts': 'Aucune publication pour le moment',

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

    // Notifications
    'notif.title': 'Notifications',
    'notif.markAllRead': 'Tout marquer comme lu',
    'notif.noNotifs': 'Aucune notification pour le moment',

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
    'upload': 'Publier',
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
    'poweredBy': 'Umurage Hub © 2026',

    // Events & Marketplace Phase 4
    'events.emptyTitle': 'Aucun événement culturel à venir pour le moment.',
    'events.emptySubtitle': 'Soyez le premier à partager un rassemblement culturel avec la communauté.',
    'events.createBtn': 'Créer un Événement',
    'marketplace.emptyTitle': 'Aucun produit culturel n\'a encore été mis en vente.',
    'marketplace.emptySubtitle': 'Soutenez les artisans culturels et créateurs traditionnels rwandais.',
    'marketplace.startSelling': 'Devenir Vendeur',
    'marketplace.listProduct': 'Lister un Produit',
    'marketplace.payOnDelivery': 'Paiement à la Livraison',
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
    'nav.upload': 'Pakia',

    // Feed Tabs & Sort
    'feed.forYou': 'Kwa Ajili Yako',
    'feed.following': 'Unaowafuata',
    'feed.explore': 'Chunguza',
    'feed.latest': 'Mpya Zaidi',
    'feed.popular': 'Maarufu Zaidi',
    'feed.trending': 'Inayovuma',
    'feed.noFollowing': 'Hakuna machapisho kutoka kwa unaowafuata',
    'feed.noPosts': 'Hakuna machapisho bado',

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

    // Notifications
    'notif.title': 'Arifa',
    'notif.markAllRead': 'Weka zote kuwa zimesomwa',
    'notif.noNotifs': 'Hakuna arifa bado',

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
    'poweredBy': 'Umurage Hub © 2026',

    // Events & Marketplace Phase 4
    'events.emptyTitle': 'Hakuna matukio ya utamaduni yajayo bado.',
    'events.emptySubtitle': 'Kuwa wa kwanza kushiriki mkusanyiko wa utamaduni na jamii.',
    'events.createBtn': 'Tengeneza Tendo',
    'marketplace.emptyTitle': 'Hakuna bidhaa za utamaduni zilizowekwa sokoni bado.',
    'marketplace.emptySubtitle': 'Saidia mafundi wa utamaduni na wabunifu wa jadi wa Rwanda.',
    'marketplace.startSelling': 'Muuza',
    'marketplace.listProduct': 'Weka Bidhaa',
    'marketplace.payOnDelivery': 'Lipa Wakati wa Kupokea',
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
