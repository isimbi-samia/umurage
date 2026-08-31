import React from 'react';
import {
  Users, ArrowLeft, Loader2, UserCheck, UserPlus,
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useFollowing, useToggleFollow } from '@/hooks/useFollow';

interface PublicProfileSummary {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  verified_type: string | null;
  role: string | null;
}

const FollowersList: React.FC = () => {
  const { user: authUser, isAuthenticated, openAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const targetUserId = params.get('user') || authUser?.id;
  const isOwnList = !params.get('user') || params.get('user') === authUser?.id;

  const { data: targetProfile, isLoading: targetProfileLoading } = useQuery({
    queryKey: ['target-profile-summary', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, username, full_name')
        .eq('id', targetUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!targetUserId,
    staleTime: 30000,
  });

  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: ['followers', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data: followRows, error } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', targetUserId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!followRows || followRows.length === 0) return [];

      const followerIds = followRows.map(f => f.follower_id).filter(Boolean);
      const { data: profiles, error: profileErr } = await supabase
        .from('public_profiles')
        .select('id, username, full_name, avatar_url, verified, verified_type, role')
        .in('id', followerIds);
      if (profileErr) throw profileErr;

      const map = new Map((profiles || []).map(p => [p.id, { ...p, verification_type: p.verified_type }]));
      return followRows.map(f => ({
        follower: map.get(f.follower_id) || ({
          id: f.follower_id,
          username: 'Member',
          full_name: 'Member',
          avatar_url: null,
          verified: false,
          role: 'user',
        } as PublicProfileSummary),
      }));
    },
    enabled: !!targetUserId,
    staleTime: 30000,
  });

  const { data: myFollowingSet } = useFollowing(authUser?.id);
  const toggleFollow = useToggleFollow();

  const handleFollowToggle = (id: string) => {
    if (!isAuthenticated || !authUser) {
      openAuth('login');
      return;
    }
    const isFollowing = myFollowingSet?.has(id) || false;
    toggleFollow.mutate({
      followerId: authUser.id,
      followingId: id,
      isFollowing,
    });
  };

  const displayName = targetProfile?.full_name || targetProfile?.username || (isOwnList ? 'You' : 'User');
  const isLoading = followersLoading || targetProfileLoading;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(218,163,72,0.18),_transparent_24%),linear-gradient(135deg,_#140c06_0%,_#2b180d_55%,_#130a06_100%)] text-umurage-cream relative overflow-x-hidden">
      <div className="inyambo-bg" />
      <div className="fixed inset-0 imigongo-pattern pointer-events-none z-0 opacity-70" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_100%_0%,_rgba(218,163,72,0.14),_transparent_30%)]" />

      <div className="relative z-10 min-h-screen px-4 py-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-umurage-subtle hover:text-umurage-cream transition-colors rounded-lg hover:bg-black/20"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-cinzel text-2xl text-umurage-gold font-bold uppercase tracking-[0.2em]">
              Followers
            </h1>
            <p className="text-umurage-muted text-sm">
              {isOwnList
                ? `${followers.length} ${followers.length === 1 ? 'person follows you' : 'people follow you'}`
                : `${followers.length} ${followers.length === 1 ? 'follower' : 'followers'} for ${displayName}`}
            </p>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={32} className="text-umurage-gold animate-spin" />
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-umurage-card border border-umurage-border flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-umurage-gold/50" />
            </div>
            <h3 className="text-umurage-cream font-semibold mb-2">No followers yet</h3>
            <p className="text-umurage-muted text-sm">
              {isOwnList ? "When people follow you, they'll appear here." : `${displayName} doesn't have any followers yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {followers.map((item) => {
              const f = item.follower;
              const userDisplayName = f.full_name || f.username || 'User';
              const isMe = authUser?.id === f.id;
              const isFollowing = myFollowingSet?.has(f.id) || false;

              return (
                <div key={f.id} className="umurage-card rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={f.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userDisplayName}`}
                        alt={userDisplayName}
                        className="w-12 h-12 rounded-full object-cover border border-umurage-border"
                      />
                      {f.verified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-umurage-verified border-2 border-umurage-bg flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/profile?user=${f.id}`}
                        className="font-semibold text-umurage-cream hover:text-umurage-gold transition-colors truncate block"
                      >
                        {userDisplayName}
                      </Link>
                      <p className="text-umurage-subtle text-xs">@{f.username || 'member'}</p>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      onClick={() => handleFollowToggle(f.id)}
                      disabled={toggleFollow.isPending}
                      className={`text-xs py-1.5 px-3.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all duration-200 flex-shrink-0 ${
                        isFollowing
                          ? 'border-umurage-border text-umurage-muted hover:border-red-500/40 hover:text-red-400'
                          : 'btn-gold'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck size={13} /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} /> Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowersList;