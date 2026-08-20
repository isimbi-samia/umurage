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
    'nav.museum': 'Digital Museum',
    'nav.timeline': 'Cultural Timeline',
    'nav.itorero': 'Digital Itorero',
    'nav.upload': 'Upload Content',

    // Search
    'search.placeholder': 'Search culture, stories, books, videos...',

    // Stories
    'stories.title': 'Cultural Stories',
    'stories.subtitle': '24-hour visual & video moments shared by the Umurage community.',
    'stories.seeAll': 'See All',
    'stories.yourStory': 'Your Story',
    'stories.addStory': 'Add Story',
    'stories.noStories': 'No active stories right now. Share the first cultural story!',
    'stories.deleteStory': 'Delete Story',
    'stories.hoursLeft': 'h left',
    'stories.views': 'views',

    // Feed
    'feed.forYou': 'For You',
    'feed.following': 'Following',
    'feed.explore': 'Explore',
    'feed.latest': 'Latest',
    'feed.noPosts': 'No posts yet. Be the first to share!',
    'feed.noFollowing': "You're not following anyone yet.",
    'feed.createPost': 'CREATE POST',
    'feed.createStory': 'CREATE 24H STORY',

    // Music & Sound
    'music.title': 'Background Music / Cultural Sound',
    'music.libraryTitle': 'Rwandan Cultural Music Library',
    'music.librarySubtitle': 'Authentic Gakondo, Intore & Heritage Sound Catalogue',
    'music.addSound': 'Add Sound',
    'music.changeSound': 'Change Sound',
    'music.removeSound': 'Remove Music',
    'music.originalSound': 'Original Audio Only',
    'music.useSound': 'Use This Sound',
    'music.selected': 'Selected',
    'music.preview': 'Preview',
    'music.searchPlaceholder': 'Search Massamba, Ruti Joel, Kayirebwa, Intore, Inanga...',
    'music.allCatalogue': 'All Catalogue',
    'music.availableToUse': 'Available to Use',
    'music.licensingRequired': 'Licensing Required',
    'music.availableAfterLicensing': 'Available after licensing',
    'music.muteVideoSound': 'Mute original video sound while music plays',
    'music.culturalSignificance': 'Cultural Significance:',
    'music.noSoundSelected': 'No background sound selected (Original sound will play).',

    // Upload
    'upload.title': 'Share Cultural Content',
    'upload.subtitle': 'Contribute to preserving Rwanda\'s rich cultural heritage for future generations.',
    'upload.culturalOnlyTitle': 'Cultural Content Upload',
    'upload.culturalOnlyDesc': 'Please upload content related to Rwandan culture; non-cultural content may be removed.',
    'upload.contentFormat': 'Content Format',
    'upload.coverThumbnail': 'Cover Thumbnail',
    'upload.contentDetails': 'Content Details',
    'upload.postTitle': 'Title *',
    'upload.postDescription': 'Description',
    'upload.category': 'Category',
    'upload.region': 'Region',
    'upload.tags': 'Tags (comma separated)',
    'upload.cancel': 'Cancel',
    'upload.publish': 'Publish Content',
    'upload.postStoryNow': 'Post Story Now',
    'upload.publishing': 'Publishing...',
    'upload.postingStory': 'Posting Story...',
    'upload.successTitle': 'Content Published!',
    'upload.storySuccessTitle': 'Story Posted!',

    // Trending & Right Sidebar
    'trending.title': 'Trending This Week',
    'trending.seeMore': 'See More',
    'trending.noContent': 'No trending content yet',
    'verified.title': 'Verified Creators',
    'verified.seeAll': 'See All',
    'verified.none': 'No verified creators yet',

    // Follow & Actions
    'follow': 'Follow',
    'following.btn': 'Following',
    'unfollow': 'Unfollow',
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

    // Events
    'events.title': 'Cultural Events',
    'events.seeAll': 'See All',
    'events.register': 'RSVP',
    'events.createEvent': 'Create Event',
    'events.noEvents': 'No upcoming events',

    // Auth
    'auth.login': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Log Out',
    'auth.loginTitle': 'Welcome Back to Umurage Hub',
    'auth.signupTitle': 'Join Umurage Hub',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.username': 'Username',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.signInRequired': 'Sign In Required',
    'auth.signInDesc': 'You need to be signed in to contribute to Umurage Hub.',

    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.selectLang': 'Select System Language',
    'settings.theme': 'Appearance Theme',
    'settings.notifications': 'Notification Preferences',
    'settings.account': 'Account Management',

    // Profile
    'profile.title': 'User Profile',
    'profile.editProfile': 'Edit Profile',
    'profile.posts': 'Posts',
    'profile.stories': 'Stories',
    'profile.saved': 'Saved',
    'profile.followers': 'Followers',
    'profile.following': 'Following',

    // Messages & Notifications
    'messages.title': 'Messages',
    'messages.noMessages': 'No conversations yet.',
    'messages.typeMessage': 'Type a message...',
    'notif.title': 'Notifications',
    'notif.noNotifs': 'No new notifications.',
    'notif.markAllRead': 'Mark all as read',

    // Footer & Misc
    'poweredBy': 'Powered by Umurage Hub',
    'joinCommunity': "Together, we keep Rwanda's living culture alive.",
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
    'nav.museum': 'Inzu y\'Umuco Digital',
    'nav.timeline': 'Amateka y\'Umuco',
    'nav.itorero': 'Itorero Digital',
    'nav.upload': 'Gusangiza Umuco',

    // Search
    'search.placeholder': 'Shakisha umuco, inkuru, ibitabo, amashusho...',

    // Stories
    'stories.title': 'Inkuru z\'Umuco z\'Iminota 24',
    'stories.subtitle': 'Amashusho n\'amafoto by\'umuco bisangizwa n\'umuryango wa Umurage Hub.',
    'stories.seeAll': 'Reba Zose',
    'stories.yourStory': 'Inkuru Yawe',
    'stories.addStory': 'Ongeraho Inkuru',
    'stories.noStories': 'Nta nkuru nshya ziriho ubu. Ba wa mbere usangiza inkuru y\'umuco!',
    'stories.deleteStory': 'Siba Inkuru',
    'stories.hoursLeft': 'amasaha asigaye',
    'stories.views': 'incuro byarebwe',

    // Feed
    'feed.forYou': 'Ibyawe',
    'feed.following': 'Abo Ukurikira',
    'feed.explore': 'Shakisha',
    'feed.latest': 'Ibigezweho',
    'feed.noPosts': 'Nta nkuru zirashyirwaho. Ba wa mbere usangiza!',
    'feed.noFollowing': 'Ntaraye ukurikira umuntu n\'umwe.',
    'feed.createPost': 'REMA INKURU',
    'feed.createStory': 'SHYIRAHO INKURU Y\'IMINOTA 24',

    // Music & Sound
    'music.title': 'Muzika y\'Inyuma / Ijwi ry\'Umuco',
    'music.libraryTitle': 'Ububiko bw\'Muzika Gakondo y\'u Rwanda',
    'music.librarySubtitle': 'Indirimbo n\'Amajwi Gakondo azwi y\'u Rwanda',
    'music.addSound': 'Ongeraho Ijwi',
    'music.changeSound': 'Hindura Muzika',
    'music.removeSound': 'Kura mo Muzika',
    'music.originalSound': 'Ijwi ry\'Umwimerere Gusa',
    'music.useSound': 'Koresha Ingingo Yabyo',
    'music.selected': 'Yatoranyijwe',
    'music.preview': 'Umva Umwimerere',
    'music.searchPlaceholder': 'Shakisha Massamba, Ruti Joel, Kayirebwa, Intore, Inanga...',
    'music.allCatalogue': 'Indirimbo Zose',
    'music.availableToUse': 'Zishobora Kukoreshwa',
    'music.licensingRequired': 'Zisaba Uruhushya',
    'music.availableAfterLicensing': 'Bizakoreshwa nyuma yo kwemererwa',
    'music.muteVideoSound': 'Zimya ijwi ry\'amashusho mugihe muzika icuranga',
    'music.culturalSignificance': 'Akamaro mu Muco:',
    'music.noSoundSelected': 'Nta muzika y\'inyuma yatoranyijwe (Ijwi ry\'umwimerere riracuranga).',

    // Upload
    'upload.title': 'Sangiza Ibikorwa by\'Umuco',
    'upload.subtitle': 'Gira uruhare mu kubungabunga n\'kubika umurage w\'u Rwanda ku bisekuru bizaza.',
    'upload.culturalOnlyTitle': 'Ibikubiye mu Muco Gusa',
    'upload.culturalOnlyDesc': 'Nyamuneka shyiraho ibijyanye n\'umuco w\'u Rwanda; ibitaribyo bishobora gukurwaho.',
    'upload.contentFormat': 'Ubwoko bw\'Ibikorwa',
    'upload.coverThumbnail': 'Ifoto y\'Igifuniko',
    'upload.contentDetails': 'Ibisobanuro by\'Ibikorwa',
    'upload.postTitle': 'Umutwe *',
    'upload.postDescription': 'Ibisobanuro',
    'upload.category': 'Icyiciro',
    'upload.region': 'Akarere',
    'upload.tags': 'Amagambo y\'Ihuriro (atandukanyijwe n\'akabande)',
    'upload.cancel': 'Kanseri',
    'upload.publish': 'Tangaza Ibikorwa',
    'upload.postStoryNow': 'Shyiraho Inkuru Ubu',
    'upload.publishing': 'Biratangazwa...',
    'upload.postingStory': 'Inkuru irashyirwaho...',
    'upload.successTitle': 'Ibikorwa Byatangajwe!',
    'upload.storySuccessTitle': 'Inkuru Yarakozwe!',

    // Trending & Right Sidebar
    'trending.title': 'Ibigezweho mu Cyumweru',
    'trending.seeMore': 'Reba Ibindi',
    'trending.noContent': 'Nta ibikorwa bigezweho bihari',
    'verified.title': 'Abahanzi Batangajwe',
    'verified.seeAll': 'Reba Bose',
    'verified.none': 'Nta bahanzi batangajwe barahagera',

    // Follow & Actions
    'follow': 'Kurikira',
    'following.btn': 'Urakurikira',
    'unfollow': 'Reka Kurikira',
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

    // Events
    'events.title': 'Ibirori by\'Umuco',
    'events.seeAll': 'Reba Byose',
    'events.register': 'Kwiyandikisha',
    'events.createEvent': 'Rema Ibirori',
    'events.noEvents': 'Nta birori biteganyijwe',

    // Auth
    'auth.login': 'Injira',
    'auth.signup': 'Iyandikishe',
    'auth.logout': 'Sohoka',
    'auth.loginTitle': 'Murakaza Neza Kuri Umurage Hub',
    'auth.signupTitle': 'Winjire mu Umurage Hub',
    'auth.email': 'Imeri Yawe',
    'auth.password': 'Ijambo ry\'Ibanga',
    'auth.name': 'Izina Ryose',
    'auth.username': 'Izina ry\'Koresha',
    'auth.noAccount': 'Ntabwo ufite konti?',
    'auth.hasAccount': 'Ufite konti tayari?',
    'auth.signInRequired': 'Kwinjira Kurasabwa',
    'auth.signInDesc': 'Ugomba kwinjira kugirango ugire uruhare mu Umurage Hub.',

    // Settings
    'settings.title': 'Igenamiterere',
    'settings.language': 'Ururimi',
    'settings.selectLang': 'Hitamo Ururimi ry\'Urusange',
    'settings.theme': 'Ishusho y\'Urusange',
    'settings.notifications': 'Igenamiterere ry\'Ibyimenyeshejo',
    'settings.account': 'Gucunga Konti',

    // Profile
    'profile.title': 'Umwirondoro w\'Umukoresha',
    'profile.editProfile': 'Hindura Umwirondoro',
    'profile.posts': 'Ibikorwa',
    'profile.stories': 'Inkuru',
    'profile.saved': 'Ibyabitswe',
    'profile.followers': 'Abagukurikira',
    'profile.following': 'Abo Ukurikira',

    // Messages & Notifications
    'messages.title': 'Ubutumwa',
    'messages.noMessages': 'Nta biganiro birahagera.',
    'messages.typeMessage': 'Andika ubutumwa...',
    'notif.title': 'Ibyimenyeshejo',
    'notif.noNotifs': 'Nta byimenyeshejo nshya.',
    'notif.markAllRead': 'Soma byose',

    // Footer & Misc
    'poweredBy': 'Ikorwa na Umurage Hub',
    'joinCommunity': 'Twese hamwe, tubungabunge umurage w\'u Rwanda.',
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
    'nav.museum': 'Musée Numérique',
    'nav.timeline': 'Chronologie Culturelle',
    'nav.itorero': 'Itorero Numérique',
    'nav.upload': 'Publier du Contenu',

    // Search
    'search.placeholder': 'Rechercher culture, histoires, livres, vidéos...',

    // Stories
    'stories.title': 'Histoires Culturelles',
    'stories.subtitle': 'Moments visuels et vidéos de 24h partagés par la communauté Umurage.',
    'stories.seeAll': 'Voir Tout',
    'stories.yourStory': 'Votre Histoire',
    'stories.addStory': 'Ajouter une Histoire',
    'stories.noStories': 'Aucune histoire active pour le moment. Soyez le premier à partager !',
    'stories.deleteStory': 'Supprimer l\'Histoire',
    'stories.hoursLeft': 'h restantes',
    'stories.views': 'vues',

    // Feed
    'feed.forYou': 'Pour Vous',
    'feed.following': 'Abonnements',
    'feed.explore': 'Explorer',
    'feed.latest': 'Récents',
    'feed.noPosts': 'Aucune publication. Soyez le premier à partager !',
    'feed.noFollowing': 'Vous ne suivez personne pour le moment.',
    'feed.createPost': 'CRÉER UNE PUBLICATION',
    'feed.createStory': 'CRÉER UNE HISTOIRE 24H',

    // Music & Sound
    'music.title': 'Musique de Fond / Son Culturel',
    'music.libraryTitle': 'Bibliothèque Musicale Culturelle du Rwanda',
    'music.librarySubtitle': 'Catalogue Authentique de Gakondo, Intore et Musique Traditionnelle',
    'music.addSound': 'Ajouter un Son',
    'music.changeSound': 'Changer la Musique',
    'music.removeSound': 'Retirer la Musique',
    'music.originalSound': 'Audio d\'Origine Uniquement',
    'music.useSound': 'Utiliser ce Son',
    'music.selected': 'Sélectionné',
    'music.preview': 'Aperçu',
    'music.searchPlaceholder': 'Rechercher Massamba, Ruti Joel, Kayirebwa, Intore, Inanga...',
    'music.allCatalogue': 'Tout le Catalogue',
    'music.availableToUse': 'Disponible à l\'Utilisation',
    'music.licensingRequired': 'Licence Requise',
    'music.availableAfterLicensing': 'Disponible après licence',
    'music.muteVideoSound': 'Couper le son de la vidéo d\'origine pendant la musique',
    'music.culturalSignificance': 'Signification Culturelle :',
    'music.noSoundSelected': 'Aucun son de fond sélectionné (Le son d\'origine sera joué).',

    // Upload
    'upload.title': 'Partager du Contenu Culturel',
    'upload.subtitle': 'Contribuez à préserver le riche patrimoine culturel du Rwanda pour les générations futures.',
    'upload.culturalOnlyTitle': 'Contenu Culturel Uniquement',
    'upload.culturalOnlyDesc': 'Veuillez télécharger du contenu lié à la culture rwandaise ; le contenu non culturel peut être retiré.',
    'upload.contentFormat': 'Format du Contenu',
    'upload.coverThumbnail': 'Vignette de Couverture',
    'upload.contentDetails': 'Détails du Contenu',
    'upload.postTitle': 'Titre *',
    'upload.postDescription': 'Description',
    'upload.category': 'Catégorie',
    'upload.region': 'Région',
    'upload.tags': 'Mots-clés (séparés par des virgules)',
    'upload.cancel': 'Annuler',
    'upload.publish': 'Publier le Contenu',
    'upload.postStoryNow': 'Publier l\'Histoire',
    'upload.publishing': 'Publication en cours...',
    'upload.postingStory': 'Histoire en cours de publication...',
    'upload.successTitle': 'Contenu Publié !',
    'upload.storySuccessTitle': 'Histoire Publiée !',

    // Trending & Right Sidebar
    'trending.title': 'Tendances de la Semaine',
    'trending.seeMore': 'Voir Plus',
    'trending.noContent': 'Aucun contenu tendance pour le moment',
    'verified.title': 'Créateurs Vérifiés',
    'verified.seeAll': 'Voir Tout',
    'verified.none': 'Aucun créateur vérifié pour le moment',

    // Follow & Actions
    'follow': 'Suivre',
    'following.btn': 'Abonné',
    'unfollow': 'Ne plus suivre',
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

    // Events
    'events.title': 'Événements Culturels',
    'events.seeAll': 'Voir Tout',
    'events.register': 'S\'inscrire',
    'events.createEvent': 'Créer un Événement',
    'events.noEvents': 'Aucun événement à venir',

    // Auth
    'auth.login': 'Se Connecter',
    'auth.signup': 'S\'inscrire',
    'auth.logout': 'Déconnexion',
    'auth.loginTitle': 'Bienvenue sur Umurage Hub',
    'auth.signupTitle': 'Rejoindre Umurage Hub',
    'auth.email': 'Adresse E-mail',
    'auth.password': 'Mot de Passe',
    'auth.name': 'Nom Complet',
    'auth.username': 'Nom d\'Utilisateur',
    'auth.noAccount': 'Vous n\'avez pas de compte ?',
    'auth.hasAccount': 'Vous avez déjà un compte ?',
    'auth.signInRequired': 'Connexion Requise',
    'auth.signInDesc': 'Vous devez être connecté pour contribuer à Umurage Hub.',

    // Settings
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.selectLang': 'Sélectionner la Langue du Système',
    'settings.theme': 'Thème d\'Apparence',
    'settings.notifications': 'Préférences de Notification',
    'settings.account': 'Gestion du Compte',

    // Profile
    'profile.title': 'Profil Utilisateur',
    'profile.editProfile': 'Modifier le Profil',
    'profile.posts': 'Publications',
    'profile.stories': 'Histoires',
    'profile.saved': 'Enregistrés',
    'profile.followers': 'Abonnés',
    'profile.following': 'Abonnements',

    // Messages & Notifications
    'messages.title': 'Messages',
    'messages.noMessages': 'Aucune conversation pour le moment.',
    'messages.typeMessage': 'Écrire un message...',
    'notif.title': 'Notifications',
    'notif.noNotifs': 'Aucune nouvelle notification.',
    'notif.markAllRead': 'Tout marquer comme lu',

    // Footer & Misc
    'poweredBy': 'Propulsé par Umurage Hub',
    'joinCommunity': 'Ensemble, gardons vivante la culture du Rwanda.',
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
    'nav.museum': 'Makumbusho ya Kidijitali',
    'nav.timeline': 'Muda wa Utamaduni',
    'nav.itorero': 'Itorero la Kidijitali',
    'nav.upload': 'Pakia Maudhui',

    // Search
    'search.placeholder': 'Tafuta utamaduni, hadithi, vitabu, video...',

    // Stories
    'stories.title': 'Hadithi za Utamaduni',
    'stories.subtitle': 'Picha na video za masa 24 zilizoshirikiwa na jamii ya Umurage.',
    'stories.seeAll': 'Ona Zote',
    'stories.yourStory': 'Hadithi Yako',
    'stories.addStory': 'Ongeza Hadithi',
    'stories.noStories': 'Hakuna hadithi amilifu kwa sasa. Kuwa wa kwanza kushiriki!',
    'stories.deleteStory': 'Futa Hadithi',
    'stories.hoursLeft': 'masaa yaliyobaki',
    'stories.views': 'mara zilizoangaliwa',

    // Feed
    'feed.forYou': 'Kwa Ajili Yako',
    'feed.following': 'Unawafuata',
    'feed.explore': 'Gundua',
    'feed.latest': 'Hivi Punde',
    'feed.noPosts': 'Bado hakuna machapisho. Kuwa wa kwanza kushiriki!',
    'feed.noFollowing': 'Bado humfuati mtu yeyote.',
    'feed.createPost': 'TENGENEZA CHAPISHO',
    'feed.createStory': 'TENGENEZA HADITHI YA MASAA 24',

    // Music & Sound
    'music.title': 'Musiki wa Nyuma / Sauti ya Utamaduni',
    'music.libraryTitle': 'Maktaba ya Musiki wa Utamaduni wa Rwanda',
    'music.librarySubtitle': 'Katalogi ya Sauti Halisi za Gakondo na Intore',
    'music.addSound': 'Ongeza Sauti',
    'music.changeSound': 'Badilisha Musiki',
    'music.removeSound': 'Odoa Musiki',
    'music.originalSound': 'Sauti Asilia Tu',
    'music.useSound': 'Tumia Sauti Hii',
    'music.selected': 'Imechaguliwa',
    'music.preview': 'Sikiliza',
    'music.searchPlaceholder': 'Tafuta Massamba, Ruti Joel, Kayirebwa, Intore, Inanga...',
    'music.allCatalogue': 'Katalogi Yote',
    'music.availableToUse': 'Inapatikana Kutumika',
    'music.licensingRequired': 'Leseni Inahitajika',
    'music.availableAfterLicensing': 'Inapatikana baada ya leseni',
    'music.muteVideoSound': 'Zima sauti ya video ya asili wakati muziki unacheza',
    'music.culturalSignificance': 'Umuhimu wa Utamaduni:',
    'music.noSoundSelected': 'Hakuna sauti ya nyuma iliyochaguliwa (Sauti asilia itacheza).',

    // Upload
    'upload.title': 'Shiriki Maudhui ya Utamaduni',
    'upload.subtitle': 'Changia katika kuhifadhi urithi tajiri wa utamaduni wa Rwanda kwa kizazi kijacho.',
    'upload.culturalOnlyTitle': 'Maudhui ya Utamaduni Tu',
    'upload.culturalOnlyDesc': 'Tafadhali pakia maudhui yanayohusiana na utamaduni wa Rwanda.',
    'upload.contentFormat': 'Muundo wa Maudhui',
    'upload.coverThumbnail': 'Picha ya Jalada',
    'upload.contentDetails': 'Maelezo ya Maudhui',
    'upload.postTitle': 'Kichwa *',
    'upload.postDescription': 'Maelezo',
    'upload.category': 'Kipengele',
    'upload.region': 'Mkoa',
    'upload.tags': 'Lebo (zikitenganishwa na koma)',
    'upload.cancel': 'Ghairi',
    'upload.publish': 'Chapisha Maudhui',
    'upload.postStoryNow': 'Chapisha Hadithi Sasa',
    'upload.publishing': 'Inachapisha...',
    'upload.postingStory': 'Hadithi inapakiwa...',
    'upload.successTitle': 'Maudhui Yamechapishwa!',
    'upload.storySuccessTitle': 'Hadithi Imepakiwa!',

    // Trending & Right Sidebar
    'trending.title': 'Vinavyovuma Wiki Hii',
    'trending.seeMore': 'Ona Zaidi',
    'trending.noContent': 'Bado hakuna maudhui yanayovuma',
    'verified.title': 'Waundaji Waliothibitishwa',
    'verified.seeAll': 'Ona Wote',
    'verified.none': 'Bado hakuna waundaji waliothibitishwa',

    // Follow & Actions
    'follow': 'Fuata',
    'following.btn': 'Unamfuata',
    'unfollow': 'Acha Kufuata',
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

    // Events
    'events.title': 'Matukio ya Utamaduni',
    'events.seeAll': 'Ona Zote',
    'events.register': 'Jiandikishe',
    'events.createEvent': 'Tengeneza Tukiio',
    'events.noEvents': 'Hakuna matukio yanayokuja',

    // Auth
    'auth.login': 'Ingia',
    'auth.signup': 'Jiandikishe',
    'auth.logout': 'Ondoka',
    'auth.loginTitle': 'Karibu Tena Umurage Hub',
    'auth.signupTitle': 'Jiunge na Umurage Hub',
    'auth.email': 'Anwani ya Barua Pepe',
    'auth.password': 'Nenosiri',
    'auth.name': 'Jina Kamili',
    'auth.username': 'Jina la Mtumiaji',
    'auth.noAccount': 'Huna akunti?',
    'auth.hasAccount': 'Unayo akunti tayari?',
    'auth.signInRequired': 'Kuingia Unahitajika',
    'auth.signInDesc': 'Unahitaji kuingia ili kuchangia Umurage Hub.',

    // Settings
    'settings.title': 'Mipangilio',
    'settings.language': 'Lugha',
    'settings.selectLang': 'Chagua Lugha ya Mfumo',
    'settings.theme': 'Muonekano',
    'settings.notifications': 'Mipangilio ya Arifa',
    'settings.account': 'Usimamizi wa Akunti',

    // Profile
    'profile.title': 'Profaili ya Mtumiaji',
    'profile.editProfile': 'Hariri Profaili',
    'profile.posts': 'Machapisho',
    'profile.stories': 'Hadithi',
    'profile.saved': 'Vilivyohifadhiwa',
    'profile.followers': 'Wanaokufuata',
    'profile.following': 'Unaowafuata',

    // Messages & Notifications
    'messages.title': 'Ujumbe',
    'messages.noMessages': 'Bado hakuna mazungumzo.',
    'messages.typeMessage': 'Andika ujumbe...',
    'notif.title': 'Arifa',
    'notif.noNotifs': 'Hakuna arifa mpya.',
    'notif.markAllRead': 'Weka zote zimesomwa',

    // Footer & Misc
    'poweredBy': 'Imewezeshwa na Umurage Hub',
    'joinCommunity': 'Pamoja, tunalinda utamaduni wa Rwanda.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Persist language selection across sessions and devices via localStorage
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

  // Update html lang attribute for accessibility
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
