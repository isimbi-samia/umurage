import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import RightSidebar from '@/components/features/RightSidebar';
import AuthModal from '@/components/features/AuthModal';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import StoriesPage from '@/pages/StoriesPage';
import OralHistory from '@/pages/OralHistory';
import CulturalMap from '@/pages/CulturalMap';
import Discussions from '@/pages/Discussions';
import CulturalEvents from '@/pages/CulturalEvents';
import Marketplace from '@/pages/Marketplace';
import Courses from '@/pages/Courses';
import MyHeritage from '@/pages/MyHeritage';
import AIGuide from '@/pages/AIGuide';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Upload from '@/pages/Upload';
import Messages from '@/pages/Messages';
import HeritageArchive from '@/pages/HeritageArchive';
import PostDetail from '@/pages/PostDetail';
import Verification from '@/pages/Verification';
import Notifications from '@/pages/Notifications';
import Register from '@/pages/Register';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import EditProfile from '@/pages/EditProfile';
import FollowersList from '@/pages/FollowersList';
import FollowingList from '@/pages/FollowingList';
import NotFound from '@/pages/NotFound';
import RealtimeInitializer from '@/components/RealtimeInitializer';

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

      <main className="relative z-10 pt-16 min-h-screen overflow-auto lg:ml-[260px] lg:mr-80">
        <div className="w-full max-w-none px-4 py-6 lg:px-6">
          {children}
        </div>
      </main>

      <div className="hidden lg:block fixed right-0 top-16 h-[calc(100vh-64px)] w-80 overflow-auto p-4 z-20">
        <RightSidebar />
      </div>

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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-umurage-gold animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeInitializer />
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
                <Route path="/stories" element={<ProtectedRoute><StoriesPage /></ProtectedRoute>} />
                <Route path="/oral-history" element={<ProtectedRoute><OralHistory /></ProtectedRoute>} />
                <Route path="/cultural-map" element={<ProtectedRoute><CulturalMap /></ProtectedRoute>} />
                <Route path="/discussions" element={<ProtectedRoute><Discussions /></ProtectedRoute>} />
                <Route path="/cultural-events" element={<ProtectedRoute><CulturalEvents /></ProtectedRoute>} />
                <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
                <Route path="/my-heritage" element={<ProtectedRoute><MyHeritage /></ProtectedRoute>} />
                <Route path="/ai-guide" element={<ProtectedRoute><AIGuide /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/heritage-archive" element={<ProtectedRoute><HeritageArchive /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/profile/followers" element={<FollowersList />} />
                <Route path="/profile/following" element={<FollowingList />} />
                {/* Truth detector removed */}
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
