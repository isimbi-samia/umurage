import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type LangCode = 'en' | 'rw' | 'fr';

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
    // Search
    'search.placeholder': 'Search culture, stories, books, videos...',
    // Stories
    'stories.title': 'Stories',
    'stories.seeAll': 'See All',
    'stories.yourStory': 'Your Story',
    'stories.addStory': 'Add Story',
    // Feed
    'feed.forYou': 'For You',
    'feed.following': 'Following',
    'feed.explore': 'Explore',
    'feed.latest': 'Latest',
    'feed.noPosts': 'No posts yet. Be the first to share!',
    'feed.noFollowing': "You're not following anyone yet.",
    // Trending
    'trending.title': 'Trending This Week',
    'trending.seeMore': 'See More',
    'trending.noContent': 'No trending content yet',
    // Verified
    'verified.title': 'Verified Creators',
    'verified.seeAll': 'See All',
    'verified.none': 'No verified creators yet',
    // Follow
    'follow': 'Follow',
    'following.btn': 'Following',
    'unfollow': 'Unfollow',
    // Events
    'events.title': 'Cultural Events',
    'events.seeAll': 'See All',
    'events.register': 'RSVP',
    'events.createEvent': 'Create Event',
    'events.noEvents': 'No upcoming events',
    'events.going': 'Going',
    'events.interested': 'Interested',
    // CTA
    'cta.share': 'Share. Preserve. Inspire.',
    'cta.together': "Together, we keep Rwanda's culture alive.",
    'cta.contribute': 'Contribute Now',
    // Auth
    'auth.login': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Log Out',
    'auth.loginTitle': 'Welcome Back',
    'auth.signupTitle': 'Join Umurage Hub',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.username': 'Username',
    'auth.phone': 'Phone Number (optional)',
    'auth.role': 'I am a...',
    'auth.role.user': 'Cultural Learner',
    'auth.role.creator': 'Cultural Creator',
    'auth.role.elder': 'Elder / Knowledge Keeper',
    'auth.role.org': 'Organization / Institution',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.forgotPassword': 'Forgot password?',
    'auth.sendCode': 'Send Verification Code',
    'auth.verifyCode': 'Verify Code',
    'auth.setPassword': 'Set New Password',
    // Actions
    'save': 'Save',
    'saved': 'Saved',
    'like': 'Like',
    'comment': 'Comment',
    'share': 'Share',
    'upload': 'Upload',
    'edit': 'Edit',
    'delete': 'Delete',
    'cancel': 'Cancel',
    'submit': 'Submit',
    'back': 'Back',
    'close': 'Close',
    'loading': 'Loading...',
    'seeMore': 'See More',
    'viewAll': 'View All',
    // Pages
    'library.title': 'Cultural Library',
    'courses.title': 'Cultural Courses',
    'ai.title': 'AI Cultural Guide',
    'ai.subtitle': 'Ask me anything about Rwandan culture, history, and traditions',
    'ai.placeholder': 'Ask about Rwandan culture... e.g. "Explain Umuganura"',
    'ai.send': 'Send',
    'ai.thinking': 'Thinking...',
    'heritage.title': 'My Heritage',
    'heritage.archive': 'Heritage Archive',
    'marketplace.title': 'Cultural Marketplace',
    'discussions.title': 'Discussions',
    'discussions.newTopic': 'New Topic',
    'discussions.replyBtn': 'Reply',
    'discussions.voteUp': 'Upvote',
    'discussions.voteDown': 'Downvote',
    // Profile
    'profile.posts': 'Posts',
    'profile.saved': 'Saved',
    'profile.heritage': 'Heritage',
    'profile.followers': 'Followers',
    'profile.following': 'Following',
    'profile.editProfile': 'Edit Profile',
    'profile.bio': 'Bio',
    'profile.location': 'Location',
    'profile.interests': 'Interests',
    'profile.noBio': 'No bio yet.',
    'profile.noPosts': 'No posts yet',
    'profile.noSaved': 'No saved content',
    'profile.noHeritage': 'No heritage recordings',
    'profile.uploadFirst': 'Upload Content',
    'profile.changePhoto': 'Change Photo',
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.account': 'Account',
    'settings.privacy': 'Privacy',
    'settings.notifications': 'Notifications',
    // Notifications
    'notif.title': 'Notifications',
    'notif.markAllRead': 'Mark all read',
    'notif.noNotifs': 'No notifications yet',
    // Upload
    'upload.title': 'Share Cultural Content',
    'upload.subtitle': "Contribute to preserving Rwanda's rich cultural heritage",
    'upload.publish': 'Publish to Umurage Hub',
    'upload.success': 'Content Published!',
    // Heritage Archive
    'archive.title': 'Heritage Archive',
    'archive.record': 'Record a Story',
    'archive.category': 'Category',
    // Verification
    'verify.title': 'Get Verified',
    'verify.apply': 'Apply for Verification',
    'verify.status': 'Application Status',
    // Map
    'map.title': 'Cultural Map',
    // Oral History
    'oral.title': 'Oral History',
    // Courses
    'courses.enroll': 'Enroll Now',
    'courses.continue': 'Continue Learning',
    'courses.completed': 'Completed',
    // Marketplace
    'marketplace.browse': 'Browse Items',
    // Footer / misc
    'poweredBy': 'Powered by Umurage Hub',
    'joinCommunity': "Join Rwanda's cultural community",
  },

  rw: {
    // Navigation
    'nav.home': 'Ahabanza',
    'nav.library': 'Ububiko',
    'nav.stories': 'Inkuru',
    'nav.oral': "Amateka y'Akamwa",
    'nav.map': 'Ikarita y\'Umuco',
    'nav.discussions': 'Ibibazo',
    'nav.events': 'Ibikorwa',
    'nav.marketplace': 'Isoko',
    'nav.courses': 'Amasomo',
    'nav.heritage': 'Umurage Wange',
    'nav.archive': "Ububiko bw'Umurage",
    'nav.verify': 'Bemeza Konti',
    'nav.ai': 'Umufasha wa AI',
    'nav.settings': 'Igenamiterere',
    // Search
    'search.placeholder': 'Shakisha umuco, inkuru, ibitabo, videwo...',
    // Stories
    'stories.title': 'Inkuru',
    'stories.seeAll': 'Reba Zose',
    'stories.yourStory': 'Inkuru Yawe',
    'stories.addStory': 'Ongeraho Inkuru',
    // Feed
    'feed.forYou': 'Kuri We',
    'feed.following': 'Ukurikiye',
    'feed.explore': 'Shakisha',
    'feed.latest': 'Bishya',
    'feed.noPosts': 'Nta makuru arahari. Uba uwa mbere usangira!',
    'feed.noFollowing': 'Ntakurikiye na rimwe.',
    // Trending
    'trending.title': 'Ibihimbaza Iki Cyumweru',
    'trending.seeMore': 'Reba Byinshi',
    'trending.noContent': 'Nta makuru ahimbaza arahari',
    // Verified
    'verified.title': 'Ababyinnyi Bemejwe',
    'verified.seeAll': 'Reba Bose',
    'verified.none': 'Nta babyinnyi bemejwe bahari',
    // Follow
    'follow': 'Kurikira',
    'following.btn': 'Ukurikiye',
    'unfollow': 'Guhagarika Gukurikira',
    // Events
    'events.title': 'Ibikorwa by\'Umuco',
    'events.seeAll': 'Reba Byose',
    'events.register': 'Iyandikishe',
    'events.createEvent': 'Shiraho Ibikorwa',
    'events.noEvents': 'Nta bikorwa biri hafi',
    'events.going': 'Nzajya',
    'events.interested': 'Nashaka',
    // CTA
    'cta.share': 'Sangira. Bika. Shishikariza.',
    "cta.together": "Hamwe, tukomeza umuco w'u Rwanda.",
    'cta.contribute': 'Tangira Gutera Inkunga',
    // Auth
    'auth.login': 'Injira',
    'auth.signup': 'Iyandikishe',
    'auth.logout': 'Sohoka',
    'auth.loginTitle': 'Murakaza Neza',
    'auth.signupTitle': 'Injira muri Umurage Hub',
    'auth.email': 'Imeyili',
    'auth.password': 'Ijambo Ryibanga',
    'auth.name': 'Amazina Yombi',
    'auth.username': 'Izina Ryugurishwa',
    'auth.phone': 'Telefoni (Ntabwo Ngombwa)',
    'auth.role': 'Ndi...',
    'auth.role.user': 'Uwiga Umuco',
    'auth.role.creator': "Umuvumbuzi w'Umuco",
    'auth.role.elder': 'Umunyamakuru/Inkuru',
    'auth.role.org': 'Umuryango/Ikigo',
    'auth.noAccount': 'Nta konti ufite?',
    'auth.hasAccount': 'Usangiye konti?',
    'auth.forgotPassword': 'Wibagiwe ijambo ryibanga?',
    'auth.sendCode': 'Ohereza Kode yo Kwemeza',
    'auth.verifyCode': 'Emeza Kode',
    'auth.setPassword': 'Shyiraho Ijambo Rishya Ryibanga',
    // Actions
    'save': 'Bika',
    'saved': 'Bibitswe',
    'like': 'Neza',
    'comment': 'Igitekerezo',
    'share': 'Sangira',
    'upload': 'Ohereza',
    'edit': 'Hindura',
    'delete': 'Siba',
    'cancel': 'Reka',
    'submit': 'Ohereza',
    'back': 'Garuka',
    'close': 'Funga',
    'loading': 'Gutegereza...',
    'seeMore': 'Reba Byinshi',
    'viewAll': 'Reba Byose',
    // Pages
    "library.title": "Ububiko bw'Umuco",
    'courses.title': "Amasomo y'Umuco",
    'ai.title': "Umufasha wa AI w'Umuco",
    'ai.subtitle': "Mbaza ikintu cyose ku muco, amateka n'imfashanyigisho y'u Rwanda",
    'ai.placeholder': 'Baza ku muco w\'u Rwanda... nko "Sobanura Umuganura"',
    'ai.send': 'Ohereza',
    'ai.thinking': 'Ntekereza...',
    'heritage.title': 'Umurage Wange',
    'heritage.archive': "Ububiko bw'Umurage",
    'marketplace.title': "Isoko y'Umuco",
    'discussions.title': 'Ibibazo',
    'discussions.newTopic': 'Ikibazo Gishya',
    'discussions.replyBtn': 'Subiza',
    'discussions.voteUp': 'Shyigikira',
    'discussions.voteDown': 'Nta Shyigikiro',
    // Profile
    'profile.posts': 'Ubutumwa',
    'profile.saved': 'Bibitswe',
    'profile.heritage': 'Umurage',
    'profile.followers': 'Bakurikiye',
    'profile.following': 'Ukurikiye',
    'profile.editProfile': 'Hindura Umwirondoro',
    'profile.bio': 'Inyandiko',
    'profile.location': 'Aho Ubarizwa',
    'profile.interests': 'Ibikugiraho Akamaro',
    'profile.noBio': 'Nta nyandiko irahari.',
    'profile.noPosts': 'Nta butumwa buhari',
    'profile.noSaved': 'Nta makuru abitswe',
    'profile.noHeritage': 'Nta makuru y\'umurage arahari',
    'profile.uploadFirst': 'Ohereza Makuru',
    'profile.changePhoto': 'Hindura Ifoto',
    // Settings
    'settings.title': 'Igenamiterere',
    'settings.language': 'Ururimi',
    'settings.account': 'Konti',
    'settings.privacy': 'Ibanga',
    'settings.notifications': 'Menyesha',
    // Notifications
    'notif.title': 'Amenyesha',
    'notif.markAllRead': 'Soma Byose',
    'notif.noNotifs': 'Nta menyesha arahari',
    // Upload
    'upload.title': 'Sangira Ibijyanye n\'Umuco',
    "upload.subtitle": "Fasha kubungabunga umurage w'u Rwanda",
    'upload.publish': 'Tangaza kuri Umurage Hub',
    'upload.success': 'Makuru Yatangazwe!',
    // Heritage Archive
    'archive.title': 'Ububiko bw\'Umurage',
    'archive.record': 'Andika Inkuru',
    'archive.category': 'Ubwoko',
    // Verification
    'verify.title': 'Bemeza Konti',
    'verify.apply': 'Saba Kwemezwa',
    'verify.status': 'Imiterere y\'Ikibazo',
    // Map
    'map.title': 'Ikarita y\'Umuco',
    // Oral History
    'oral.title': "Amateka y'Akamwa",
    // Courses
    'courses.enroll': 'Iyandikishe',
    'courses.continue': 'Komeza Kwiga',
    'courses.completed': 'Byarangiye',
    // Marketplace
    'marketplace.browse': 'Reba Ibicuruzwa',
    // Footer
    'poweredBy': 'Inkunga ya Umurage Hub',
    'joinCommunity': "Injira muri rusange y'umuco w'u Rwanda",
  },

  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.library': 'Bibliothèque',
    'nav.stories': 'Histoires',
    'nav.oral': 'Histoire Orale',
    'nav.map': 'Carte Culturelle',
    'nav.discussions': 'Discussions',
    'nav.events': 'Événements',
    'nav.marketplace': 'Marché',
    'nav.courses': 'Cours',
    'nav.heritage': 'Mon Héritage',
    'nav.archive': 'Archive du Patrimoine',
    'nav.verify': 'Obtenir Vérification',
    'nav.ai': 'Guide Culturel IA',
    'nav.settings': 'Paramètres',
    // Search
    'search.placeholder': 'Rechercher culture, histoires, livres, vidéos...',
    // Stories
    'stories.title': 'Histoires',
    'stories.seeAll': 'Voir tout',
    'stories.yourStory': 'Votre Histoire',
    'stories.addStory': 'Ajouter Histoire',
    // Feed
    'feed.forYou': 'Pour Vous',
    'feed.following': 'Abonnements',
    'feed.explore': 'Explorer',
    'feed.latest': 'Récent',
    'feed.noPosts': 'Aucun contenu encore. Soyez le premier à partager!',
    'feed.noFollowing': "Vous ne suivez personne encore.",
    // Trending
    'trending.title': 'Tendances Cette Semaine',
    'trending.seeMore': 'Voir Plus',
    'trending.noContent': 'Aucun contenu tendance',
    // Verified
    'verified.title': 'Créateurs Vérifiés',
    'verified.seeAll': 'Voir Tout',
    'verified.none': 'Aucun créateur vérifié',
    // Follow
    'follow': 'Suivre',
    'following.btn': 'Abonné',
    'unfollow': 'Ne plus suivre',
    // Events
    'events.title': 'Événements Culturels',
    'events.seeAll': 'Voir Tout',
    'events.register': "S'inscrire",
    'events.createEvent': 'Créer Événement',
    'events.noEvents': 'Aucun événement à venir',
    'events.going': "J'y vais",
    'events.interested': 'Intéressé',
    // CTA
    'cta.share': 'Partager. Préserver. Inspirer.',
    'cta.together': 'Ensemble, nous gardons la culture rwandaise vivante.',
    'cta.contribute': 'Contribuer Maintenant',
    // Auth
    'auth.login': 'Se Connecter',
    'auth.signup': "S'inscrire",
    'auth.logout': 'Se Déconnecter',
    'auth.loginTitle': 'Bon Retour',
    'auth.signupTitle': 'Rejoignez Umurage Hub',
    'auth.email': 'Adresse Email',
    'auth.password': 'Mot de Passe',
    'auth.name': 'Nom Complet',
    'auth.username': "Nom d'utilisateur",
    'auth.phone': 'Numéro de Téléphone (facultatif)',
    'auth.role': 'Je suis...',
    'auth.role.user': 'Apprenant Culturel',
    'auth.role.creator': 'Créateur Culturel',
    'auth.role.elder': 'Ancien / Gardien du Savoir',
    'auth.role.org': 'Organisation / Institution',
    'auth.noAccount': 'Pas de compte?',
    'auth.hasAccount': 'Vous avez déjà un compte?',
    'auth.forgotPassword': 'Mot de passe oublié?',
    'auth.sendCode': 'Envoyer le Code de Vérification',
    'auth.verifyCode': 'Vérifier le Code',
    'auth.setPassword': 'Définir un Nouveau Mot de Passe',
    // Actions
    'save': 'Sauvegarder',
    'saved': 'Sauvegardé',
    'like': 'Aimer',
    'comment': 'Commenter',
    'share': 'Partager',
    'upload': 'Télécharger',
    'edit': 'Modifier',
    'delete': 'Supprimer',
    'cancel': 'Annuler',
    'submit': 'Soumettre',
    'back': 'Retour',
    'close': 'Fermer',
    'loading': 'Chargement...',
    'seeMore': 'Voir Plus',
    'viewAll': 'Voir Tout',
    // Pages
    'library.title': 'Bibliothèque Culturelle',
    'courses.title': 'Cours Culturels',
    'ai.title': 'Guide Culturel IA',
    'ai.subtitle': "Posez-moi n'importe quelle question sur la culture, l'histoire et les traditions rwandaises",
    'ai.placeholder': 'Demandez sur la culture rwandaise... ex: "Expliquez Umuganura"',
    'ai.send': 'Envoyer',
    'ai.thinking': 'Réflexion...',
    'heritage.title': 'Mon Héritage',
    'heritage.archive': 'Archive du Patrimoine',
    'marketplace.title': 'Marché Culturel',
    'discussions.title': 'Discussions',
    'discussions.newTopic': 'Nouveau Sujet',
    'discussions.replyBtn': 'Répondre',
    'discussions.voteUp': 'Voter pour',
    'discussions.voteDown': 'Voter contre',
    // Profile
    'profile.posts': 'Publications',
    'profile.saved': 'Sauvegardés',
    'profile.heritage': 'Patrimoine',
    'profile.followers': 'Abonnés',
    'profile.following': 'Abonnements',
    'profile.editProfile': 'Modifier le Profil',
    'profile.bio': 'Biographie',
    'profile.location': 'Localisation',
    'profile.interests': 'Intérêts',
    'profile.noBio': 'Pas de biographie encore.',
    'profile.noPosts': 'Aucune publication',
    'profile.noSaved': 'Aucun contenu sauvegardé',
    'profile.noHeritage': "Aucun enregistrement patrimonial",
    'profile.uploadFirst': 'Télécharger du Contenu',
    'profile.changePhoto': 'Changer Photo',
    // Settings
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.account': 'Compte',
    'settings.privacy': 'Confidentialité',
    'settings.notifications': 'Notifications',
    // Notifications
    'notif.title': 'Notifications',
    'notif.markAllRead': 'Tout marquer comme lu',
    'notif.noNotifs': 'Aucune notification',
    // Upload
    'upload.title': 'Partager du Contenu Culturel',
    "upload.subtitle": "Contribuez à préserver le riche patrimoine culturel du Rwanda",
    'upload.publish': 'Publier sur Umurage Hub',
    'upload.success': 'Contenu Publié!',
    // Heritage Archive
    'archive.title': 'Archive du Patrimoine',
    'archive.record': 'Enregistrer une Histoire',
    'archive.category': 'Catégorie',
    // Verification
    'verify.title': 'Obtenir Vérification',
    'verify.apply': 'Demander la Vérification',
    'verify.status': 'Statut de la Demande',
    // Map
    'map.title': 'Carte Culturelle',
    // Oral History
    'oral.title': 'Histoire Orale',
    // Courses
    'courses.enroll': "S'inscrire",
    'courses.continue': 'Continuer à Apprendre',
    'courses.completed': 'Terminé',
    // Marketplace
    'marketplace.browse': 'Parcourir les Articles',
    // Footer
    'poweredBy': 'Propulsé par Umurage Hub',
    'joinCommunity': "Rejoignez la communauté culturelle du Rwanda",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Persist language selection across sessions and devices via localStorage
  const [lang, setLangState] = useState<LangCode>(() => {
    try {
      const stored = localStorage.getItem('umurage-lang');
      if (stored && ['en', 'rw', 'fr'].includes(stored)) return stored as LangCode;
    } catch {}
    return 'en';
  });

  const setLang = (newLang: LangCode) => {
    setLangState(newLang);
    try { localStorage.setItem('umurage-lang', newLang); } catch {}
  };

  // Also update the html lang attribute for accessibility
  useEffect(() => {
    document.documentElement.lang = lang === 'rw' ? 'rw' : lang === 'fr' ? 'fr' : 'en';
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
