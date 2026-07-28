import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AuthModal from '@/components/features/AuthModal';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import StoriesPage from '@/pages/StoriesPage';
import OralHistory from '@/pages/OralHistory';
import CulturalMap from '@/pages/CulturalMap';
import Discussions from '@/pages/Discussions';
import Events from '@/pages/Events';
import Marketplace from '@/pages/Marketplace';
import Courses from '@/pages/Courses';
import MyHeritage from '@/pages/MyHeritage';
import AIGuide from '@/pages/AIGuide';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Upload from '@/pages/Upload';
import HeritageArchive from '@/pages/HeritageArchive';
import PostDetail from '@/pages/PostDetail';
import Verification from '@/pages/Verification';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(218,163,72,0.18),_transparent_24%),linear-gradient(135deg,_#140c06_0%,_#2b180d_55%,_#130a06_100%)] text-umurage-cream relative overflow-x-hidden">
      <div className="inyambo-bg" />
      <div className="fixed inset-0 imigongo-pattern pointer-events-none z-0 opacity-70" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_100%_0%,_rgba(218,163,72,0.14),_transparent_30%)]" />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        menuOpen={sidebarOpen}
      />

      <main className="relative z-10 lg:ml-[280px] pt-16 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <AuthModal />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#221508',
            border: '1px solid #3D2510',
            color: '#F5E6D0',
          },
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/library" element={<Library />} />
                <Route path="/stories" element={<StoriesPage />} />
                <Route path="/oral-history" element={<OralHistory />} />
                <Route path="/cultural-map" element={<CulturalMap />} />
                <Route path="/discussions" element={<Discussions />} />
                <Route path="/events" element={<Events />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/my-heritage" element={<MyHeritage />} />
                <Route path="/ai-guide" element={<AIGuide />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/heritage-archive" element={<HeritageArchive />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
