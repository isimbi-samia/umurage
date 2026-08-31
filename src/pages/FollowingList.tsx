import React from 'react';
import {
  Users, ArrowLeft, Sparkles, UserPlus,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const FollowingList: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: following = [], isLoading } = useQuery({
    queryKey: ['following-list', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: followRows, error } = await supabase
        .from('follows')
        .select('following_id, created_at')
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!followRows || followRows.length === 0) return [];

      const followingIds = followRows.map(f => f.following_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, username, full_name, avatar_url, verified, verified_type, role')
        .in('id', followingIds);

      const map = new Map((profiles || []).map(p => [p.id, { ...p, verification_type: p.verified_type }]));
      return followRows.map(f => ({
        following: map.get(f.following_id) || {
          id: f.following_id,
          username: 'Member',
          avatar_url: null,
          verified: false,
          role: 'user',
        },
      }));
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="text-5xl mb-4">👥</div>
        <h2 className="font-cinzel text-umurage-gold text-2xl font-bold mb-3">Sign In</h2>
        <p className="text-umurage-muted text-sm mb-6">Sign in to view who you follow.</p>
        <button onClick={() => navigate('/login')} className="btn-gold px-8 py-3">Sign In</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(218,163,72,0.18),_transparent_24_),linear-gradient(135deg,_#140c06_0%,_#2b180d_55%,_#130a06_100%)] text-umurage-cream relative overflow-x-hidden">
      <div className="inyambo-bg" />
      <div className="fixed inset-0 imigongo-pattern pointer-events-none z-0 opacity-70" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_100%_0%,_rgba(218,163,72,0.14),_transparent_30%)]" />

      <div className="relative z-10 min-h-screen px-4 py-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <button onClick={() => navigate(-1)} className="p-2 text-umurage-subtle hover:text-umurage-cream transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-cinzel text-2xl text-umurage-gold font-bold uppercase tracking-[0.2em]">Following</h1>
            <p className="text-umurage-muted text-sm">{following.length} people you follow</p>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Users size={32} className="text-umurage-gold animate-spin" />
          </div>
        ) : following.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-umurage-card border border-umurage-border flex items-center justify-center mx-auto mb-4">
              <UserPlus size={24} className="text-umurage-gold/50" />
            </div>
            <h3 className="text-umurage-cream font-semibold mb-2">Not following anyone yet</h3>
            <p className="text-umurage-muted text-sm">Explore the platform and follow creators, elders, and institutions.</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {following.map((follow: { following: { id: string; username: string | null; email: string; avatar_url: string | null; verified: boolean; verified_type: string | null; role: string; full_name: string | null } }) => {
              const f = follow.following;
              const displayName = f.full_name || f.username || f.email?.split('@')[0] || 'User';
              return (
                <div key={f.id} className="umurage-card rounded-2xl p-4 flex items-center gap-4 animate-fade-in">
                  <div className="relative flex-shrink-0">
                    <img
                      src={f.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`}
                      alt={displayName}
                      className="w-12 h-12 rounded-full object-cover border border-umurage-border"
                    />
                    {f.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-umurage-verified border-2 border-umurage-bg flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile?user=${f.id}`} className="font-semibold text-umurage-cream hover:text-umurage-gold transition-colors truncate block">
                      {displayName}
                    </Link>
                    <p className="text-umurage-subtle text-xs">@{f.username || f.email?.split('@')[0]}</p>
                  </div>
                  <div className="flex items-center gap-1 text-umurage-gold text-xs">
                    <UserPlus size={14} /> Following
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingList;