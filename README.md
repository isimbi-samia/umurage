# UMURAGE HUB

> **Preserve. Connect. Celebrate.**

Umurage Hub is a digital cultural heritage ecosystem designed to preserve, document, educate, and promote Rwanda's cultural heritage through technology.

The platform brings cultural stories, oral history, educational resources, community contributions, cultural events, heritage archives, marketplaces, and digital cultural experiences into one connected digital space.

---

## 🌍 About Umurage Hub

Cultural heritage is carried through stories, language, traditions, music, art, historical knowledge, places, objects, ceremonies, and the memories of generations.

Umurage Hub was created to help ensure that this heritage can be preserved and accessed by present and future generations.

The platform is designed to connect:

- Cultural researchers
- Students and educators
- Elders and knowledge keepers
- Creators and storytellers
- Cultural organizations
- Artisans and businesses
- Young people
- Communities interested in Rwandan heritage

The goal is not simply to store cultural information, but to create a living digital ecosystem where people can **learn, contribute, discover, connect, and preserve culture together.**

---

# ✨ Core Features

## 🏠 Home

The Home page provides a central cultural discovery experience where users can:

- Discover cultural posts
- Explore trending cultural content
- View featured contributors
- Discover upcoming cultural events
- Explore stories and community contributions
- Navigate to other cultural sections of the platform

---

## 📚 Cultural Library

The Library provides a digital space for cultural resources such as:

- Books
- Articles
- Historical resources
- Educational materials
- Cultural documents
- Audio resources
- Other digital heritage materials

---

## 🎥 Stories

Users can share cultural stories through media.

Stories are designed to provide a temporary, social-media-style way of sharing cultural moments and experiences.

The system supports:

- Image stories
- Video stories
- Captions
- Story expiration
- Story views
- Story authors
- Story deletion by the owner

---

## 🎙️ Oral History

The Oral History section focuses on preserving knowledge and memories shared by people and communities.

It provides a foundation for documenting:

- Traditional knowledge
- Personal memories
- Community stories
- Historical experiences
- Cultural practices
- Knowledge from elders and cultural custodians

---

## 🗺️ Cultural Map

The Cultural Map is intended to help users discover culturally significant locations and heritage-related places.

Possible applications include:

- Historical locations
- Cultural landmarks
- Museums
- Heritage sites
- Community locations
- Cultural events

---

## 💬 Messages

Umurage Hub includes a messaging system designed to allow users to communicate with one another.

The messaging system includes concepts such as:

- Conversations
- Conversation members
- Messages
- Real-time communication

---

## 💭 Discussions

The Discussions section provides a community space for conversations around culture, heritage, history, traditions, language, and related topics.

---

## 📅 Cultural Events

Users can discover and explore cultural events.

The system supports cultural event information such as:

- Event names
- Dates
- Locations
- Descriptions
- Cultural categories
- Upcoming events

---

## 🛍️ Marketplace

The Marketplace provides a digital space for cultural products and businesses.

It is intended to help connect cultural creators, artisans, sellers, and customers.

The system includes functionality for:

- Products
- Orders
- Order items
- Reviews
- Marketplace discovery

---

## 🎓 Cultural Courses

The Courses section is designed to provide educational experiences around Rwandan culture and heritage.

Potential learning areas include:

- Rwandan history
- Culture and traditions
- Language
- Traditional practices
- Arts and crafts
- Cultural values
- Heritage preservation

---

## ❤️ My Heritage

My Heritage provides a personalized space where users can interact with and keep track of cultural content that is meaningful to them.

---

## 🤖 AI Cultural Guide

The AI Cultural Guide is designed to provide an interactive way for users to explore cultural knowledge and ask questions related to heritage.

The goal is to make cultural learning more accessible and interactive while keeping cultural information respectful and grounded in reliable heritage knowledge.

---

## 👤 Profiles

Users have personal profiles containing information such as:

- Username
- Full name
- Profile picture
- Biography
- Verification status
- Role
- Followers
- Following
- Cultural contributions

Profiles also provide a foundation for creator and community identity within Umurage Hub.

---

## 🔐 Authentication

Umurage Hub uses authentication to manage user accounts and protected sections of the application.

Authentication-related functionality includes:

- Registration
- Login
- Logout
- Password recovery
- Password reset
- Protected routes
- User profiles

---

# 🏗️ Technology Stack

Umurage Hub is built using modern web technologies.

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React

### Backend / Database

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage
- Supabase Row Level Security (RLS)
- Supabase Realtime

### Data & Application State

- TanStack React Query

### Notifications

- Sonner

### Deployment

- Vercel

---

# 📁 Project Structure

The project follows a component-based React architecture.

```text
umurage/
│
├── public/
│
├── scripts/
│
├── src/
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── features/
│   │   │   ├── AuthModal.tsx
│   │   │   ├── ContentCard.tsx
│   │   │   ├── InstallPrompt.tsx
│   │   │   ├── RightSidebar.tsx
│   │   │   └── StoriesBar.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   │
│   │   ├── ui/
│   │   └── RealtimeInitializer.tsx
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   │
│   ├── data/
│   │
│   ├── hooks/
│   │   ├── useFollow.ts
│   │   ├── useMessages.ts
│   │   ├── useToast.ts
│   │   └── ...
│   │
│   ├── lib/
│   │   └── supabase.ts
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Library.tsx
│   │   ├── StoriesPage.tsx
│   │   ├── OralHistory.tsx
│   │   ├── CulturalMap.tsx
│   │   ├── Discussions.tsx
│   │   ├── CulturalEvents.tsx
│   │   ├── Marketplace.tsx
│   │   ├── Courses.tsx
│   │   ├── MyHeritage.tsx
│   │   ├── AIGuide.tsx
│   │   ├── Messages.tsx
│   │   ├── Notifications.tsx
│   │   ├── Profile.tsx
│   │   ├── Upload.tsx
│   │   └── ...
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── .env
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md