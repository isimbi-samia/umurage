import React, { useState, useRef } from 'react';
import {
  Settings, BookOpen, Heart, Archive, Edit2, Check, X, MapPin, Loader2,
  Camera, Star, UserCheck, UserPlus, ChevronLeft, CheckCircle,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToggleFollow } from '@/hooks/useFollow';
import { useUserLikes, useUserSaves } from '@/hooks/usePosts';
import ContentCard from '@/components/features/ContentCard';
import { toast } from 'sonner';

const INTERESTS = [
  'History', 'Music', 'Dance', 'Arts', 'Language', 'Traditions',
  'Ceremonies', 'Oral Heritage', 'Literature', 'Nature',
];

interface ProfileRecord {
  id: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  cover_image_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  location?: string | null;
  interests?: string[] | null;
  role?: string | null;
  verified?: boolean | null;
  verification_type?: string | null;
  followers_count?: number | null;
  following_count?: number | null;
  posts_count?: number | null;
}

interface ProfileAuthorRecord {
  id: string;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  verified?: boolean | null;
  verified_type?: string | null;
  role?: string | null;
}

interface ProfilePostRecord {
  id: string;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  thumbnail_url?: string | null;
  media_url?: string | null;
  duration?: string | null;
  category?: string | null;
  region?: string | null;
  tags?: string[] | null;
  created_at?: string;
  user_id?: string;
  author?: ProfileAuthorRecord | null;
  likes_count?: number | null;
  comments_count?: number | null;
  shares_count?: number | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  thumbnail?: string | null;
  timeAgo?: string | null;
  saved?: boolean | null;
  liked?: boolean | null;
}

function useUserProfile(userId?: string) {
  return useQuery<ProfileRecord | null>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, full_name, username, avatar_url, cover_image_url, cover_url, bio, location, interests, role, verified, verification_type, followers_count, following_count, posts_count')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return (data as ProfileRecord | null) ?? null;
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

// ── Fetch a user's own posts, then their profile separately (no embedded join) ──
function useUserPosts(userId?: string) {
  return useQuery<ProfilePostRecord[]>({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, title, description, type, thumbnail_url, media_url, duration, category, region, tags, created_at, likes_count, comments_count, shares_count, views, user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const { data: authorProfile } = await supabase
        .from('public_profiles')
        .select('id, username, avatar_url, verified, verification_type, role')
        .eq('id', userId)
        .maybeSingle();

      const author: ProfileAuthorRecord | null = authorProfile
        ? {
            id: authorProfile.id,
            username: authorProfile.username,
            email: authorProfile.email,
            avatar_url: authorProfile.avatar_url,
            verified: authorProfile.verified,
            verified_type: authorProfile.verification_type,
            role: authorProfile.role,
          }
        : null;

      return (posts as ProfilePostRecord[]).map(p => ({ ...p, author }));
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

function useUserHeritage(userId?: string) {
  return useQuery<ProfilePostRecord[]>({
    queryKey: ['user-heritage', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, description, type, thumbnail_url, media_url, duration, category, region, tags, created_at, likes_count, comments_count, shares_count, views')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProfilePostRecord[];
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

function useIsFollowing(followerId?: string, followingId?: string) {
  return useQuery({
    queryKey: ['is-following', followerId, followingId],
    queryFn: async () => {
      if (!followerId || !followingId || followerId === followingId) return false;
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!followerId && !!followingId,
    staleTime: 30000,
  });
}

function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, userId }: { file: File; userId: string }) => {
      const compressed = await compressImage(file, 256, 0.88);
      const path = `${userId}/avatar/profile.jpg`;
      const { url: avatarUrl } = await uploadProfileAsset(compressed, path, 'image/jpeg');
      const { error: profileError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
      if (profileError) throw profileError;
      await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
      return avatarUrl;
    },
    onSuccess: (_url, { userId }) => {
      qc.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success('Profile photo updated!');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to upload photo'),
  });
}

function useUploadCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, userId }: { file: File; userId: string }) => {
      const compressed = await compressImage(file, 1200, 0.9);
      const path = `${userId}/cover/cover.jpg`;
      const { url: coverUrl } = await uploadProfileAsset(compressed, path, 'image/jpeg');
      const { error: profileError } = await supabase.from('profiles').update({ cover_image_url: coverUrl }).eq('id', userId);
      if (profileError) throw profileError;
      return coverUrl;
    },
    onSuccess: (_url, { userId }) => {
      qc.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success('Cover image updated!');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to upload cover image'),
  });
}

async function compressImage(file: File, maxSize: number, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.floor(img.width * ratio));
      canvas.height = Math.max(1, Math.floor(img.height * ratio));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(new Blob([file]));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => resolve(blob || new Blob()), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(new Blob([file])); };
    img.src = url;
  });
}

async function uploadProfileAsset(file: Blob, path: string, contentType: string) {
  const buckets = ['avatars', 'umurage-media'];
  let lastError: Error | null = null;

  for (const bucket of buckets) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType });
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { url: `${data.publicUrl}?t=${Date.now()}`, bucket };
    }

    const message = error.message || '';
    const isMissingBucket = /bucket|not found|does not exist/i.test(message);
    if (!isMissingBucket) {
      throw error;
    }
    lastError = error;
  }

  if (lastError) throw lastError;
  throw new Error('Unable to upload profile media.');
}

// ─────────────────────────────────────────────────────────────────────────
// Profile Page
// ─────────────────────────────────────────────────────────────────────────
const Profile: React.FC = () => {
  const { user: authUser, isAuthenticated, openAuth, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  // Resolve whose profile to show
  const params = new URLSearchParams(location.search);
  const targetUserId = params.get('user') || authUser?.id;
  const isOwnProfile = !params.get('user') || params.get('user') === authUser?.id;

  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'heritage'>('posts');
  const [editing, setEditing] = useState(false);
  const [fullNameField, setFullNameField] = useState('');
  const [usernameField, setUsernameField] = useState('');
  const [bio, setBio] = useState('');
  const [locField, setLocField] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();
  const uploadCover = useUploadCover();

  const { data: profile, isLoading: profileLoading } = useUserProfile(targetUserId || undefined);
  const { data: userPosts = [], isLoading: postsLoading } = useUserPosts(targetUserId || undefined);
  const { data: heritageItems = [], isLoading: heritageLoading } = useUserHeritage(targetUserId || undefined);

  // ── Saved posts: fetch saves -> posts -> authors as separate queries (no embedded join on a view) ──
  const { data: savedPosts = [], isLoading: savedLoading } = useQuery<ProfilePostRecord[]>({
    queryKey: ['saved-posts', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id || !isOwnProfile) return [];

      const { data: saves, error: savesError } = await supabase
        .from('saves')
        .select('post_id, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });
      if (savesError) throw savesError;
      if (!saves || saves.length === 0) return [];

      const postIds = saves.map((s: { post_id: string }) => s.post_id);
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds);
      if (postsError) throw postsError;

      const authorIds = [...new Set((posts || []).map((p: { user_id: string }) => p.user_id))];
      const { data: authors } = await supabase
        .from('public_profiles')
        .select('id, username, avatar_url, verified, verification_type, role')
        .in('id', authorIds);

      const authorMap = new Map(
        (authors || []).map((a: Record<string, unknown>) => [
          a.id,
          {
            id: a.id,
            username: a.username,
            avatar_url: a.avatar_url,
            verified: a.verified,
            verified_type: a.verification_type,
            role: a.role,
          } as ProfileAuthorRecord,
        ])
      );

      const postMap = new Map((posts || []).map((p: ProfilePostRecord) => [p.id, p]));

      return saves
        .map((s: { post_id: string }) => postMap.get(s.post_id))
        .filter((p): p is ProfilePostRecord => !!p)
        .map(p => ({ ...p, author: authorMap.get(p.user_id as string) || null }));
    },
    enabled: !!authUser?.id && isOwnProfile,
    staleTime: 30000,
  });

  const { data: likedSet } = useUserLikes(authUser?.id);
  const { data: savedSet } = useUserSaves(authUser?.id);
  const { data: isFollowing, refetch: refetchFollow } = useIsFollowing(authUser?.id, targetUserId || undefined);
  const toggleFollow = useToggleFollow();

  // Populate edit form when entering edit mode
  const startEdit = () => {
    setFullNameField(profile?.full_name || authUser?.name || '');
    setUsernameField(profile?.username || authUser?.username || '');
    setBio(profile?.bio || '');
    setLocField(profile?.location || '');
    setInterests(profile?.interests || []);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!authUser) return;
    setSaving(true);
    setProfileError(null);
    try {
      await updateProfile({
        full_name: fullNameField,
        username: usernameField,
        bio,
        location: locField,
        interests,
      });
      qc.invalidateQueries({ queryKey: ['profile', authUser.id] });
      qc.invalidateQueries({ queryKey: ['posts'] });
      setEditing(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not save profile');
      toast.error(error instanceof Error ? error.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFollow = () => {
    if (!isAuthenticated || !authUser) { openAuth('login'); return; }
    if (!targetUserId) return;
    toggleFollow.mutate(
      { followerId: authUser.id, followingId: targetUserId, isFollowing: !!isFollowing },
      { onSuccess: () => { refetchFollow(); qc.invalidateQueries({ queryKey: ['profile', targetUserId] }); } }
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    uploadAvatar.mutate({ file, userId: authUser.id });
    e.target.value = '';
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Cover image must be under 5MB'); return; }
    uploadCover.mutate({ file, userId: authUser.id });
    e.target.value = '';
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  // ── Not authenticated and viewing own profile ──
  if (!isAuthenticated && !params.get('user')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="font-cinzel text-umurage-gold text-2xl font-bold mb-3">Sign In to View Profile</h2>
        <p className="text-umurage-muted text-sm mb-6">Access your profile, saved content, and cultural journey.</p>
        <button onClick={() => openAuth('login')} className="btn-gold px-8 py-3">Sign In</button>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={36} className="text-umurage-gold animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="font-cinzel text-umurage-gold text-2xl font-bold mb-3">Profile Not Found</h2>
        <button onClick={() => navigate('/')} className="btn-gold px-8 py-3 mt-4">Back to Home</button>
      </div>
    );
  }

  const displayName = profile.full_name || profile.username || profile.email?.split('@')[0] || 'User';
  const avatarSrc = profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;
  const coverSrc = profile.cover_image_url || profile.cover_url || 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Back button when viewing another user */}
      {!isOwnProfile && (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-umurage-muted hover:text-umurage-cream text-sm mb-5 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
      )}

      {/* ── Profile Header ── */}
      <div className="overflow-hidden rounded-[28px] border border-amber-400/20 bg-[rgba(27,16,8,0.74)] shadow-[0_18px_45px_rgba(0,0,0,0.22)] mb-6">
        <div className="relative h-36 sm:h-48">
          <img src={coverSrc} alt="Cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {isOwnProfile && (
            <div className="absolute right-4 top-4">
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadCover.isPending}
                className="rounded-full border border-white/20 bg-black/40 px-3 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-black/60"
              >
                {uploadCover.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Update cover'}
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start gap-5">
          {/* Avatar with upload */}
          <div className="relative flex-shrink-0">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover border-2 border-umurage-gold/40"
            />
            {profile.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-umurage-verified border-2 border-umurage-bg flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">✓</span>
              </div>
            )}
            {/* Camera overlay — only on own profile */}
            {isOwnProfile && (
              <>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadAvatar.isPending}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center group"
                  title="Change profile photo"
                >
                  {uploadAvatar.isPending
                    ? <Loader2 size={20} className="text-white animate-spin" />
                    : <Camera size={20} className="text-white" />
                  }
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-cinzel text-umurage-gold text-xl font-bold">{displayName}</h1>
                <p className="text-umurage-muted text-sm">@{profile.username || displayName}</p>
                {profile.verified && profile.verification_type && (
                  <span className="inline-flex items-center gap-1 text-umurage-verified text-xs font-medium mt-1">
                    <Star size={11} fill="currentColor" /> {profile.verification_type}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-umurage-subtle text-xs mt-1 ml-2 capitalize">
                  · {profile.role || 'user'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {isOwnProfile ? (
                  <>
                    {!editing ? (
                      <>
                        <button onClick={startEdit} className="btn-outline-gold text-xs py-2 px-3 flex items-center gap-1.5">
                          <Edit2 size={13} /> Edit Profile
                        </button>
                        <button onClick={() => navigate('/settings')} className="p-2 text-umurage-muted hover:text-umurage-cream hover:bg-umurage-surface rounded-lg transition-colors">
                          <Settings size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={handleSave} disabled={saving} className="btn-gold text-xs py-2 px-3 flex items-center gap-1.5">
                          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                        </button>
                        <button onClick={() => setEditing(false)} className="p-2 text-umurage-muted hover:text-red-400 hover:bg-umurage-surface rounded-lg transition-colors">
                          <X size={18} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  /* Follow/Unfollow for other users */
                  isAuthenticated ? (
                    <button
                      onClick={handleFollow}
                      disabled={toggleFollow.isPending}
                      className={`text-xs py-2 px-4 rounded-xl border font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                        isFollowing
                          ? 'border-umurage-border text-umurage-muted hover:border-red-500/40 hover:text-red-400'
                          : 'btn-gold'
                      }`}
                    >
                      {toggleFollow.isPending
                        ? <Loader2 size={13} className="animate-spin" />
                        : isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />
                      }
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  ) : (
                    <button onClick={() => openAuth('login')} className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5">
                      <UserPlus size={13} /> Follow
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-3 flex flex-wrap gap-4">
              {[
                { label: 'Posts', value: profile.posts_count ?? 0, to: '#' },
                { label: 'Followers', value: profile.followers_count ?? 0, to: '/profile/followers' },
                { label: 'Following', value: profile.following_count ?? 0, to: '/profile/following' },
              ].map(stat => (
                <Link
                  key={stat.label}
                  to={stat.to}
                  className="rounded-xl border border-transparent px-2 py-1 text-center transition hover:border-amber-400/20 hover:bg-black/20"
                >
                  <p className="text-lg font-bold leading-none text-umurage-gold font-cinzel">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-umurage-subtle">{stat.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {profileError && <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{profileError}</div>}

        {/* Avatar upload hint */}
        {isOwnProfile && !profile.avatar_url && (
          <div className="mt-3 p-3 bg-umurage-gold/8 border border-umurage-gold/20 rounded-xl flex items-center gap-2">
            <Camera size={14} className="text-umurage-gold flex-shrink-0" />
            <p className="text-umurage-muted text-xs">
              <button onClick={() => avatarInputRef.current?.click()} className="text-umurage-gold hover:underline font-medium">Add a profile photo</button>
              {' '}— hover your avatar above and click the camera icon
            </p>
          </div>
        )}

        {/* Profile edit fields — view or edit */}
        <div className="mt-4 space-y-3">
          {editing ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-umurage-muted text-xs font-medium block mb-1">Full Name</label>
                  <input
                    type="text" value={fullNameField} onChange={e => setFullNameField(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-[#1a110a] border border-[#2d1e13] rounded-lg px-3 py-2 text-xs text-[#f2e6d8] placeholder-[#7a6754] focus:outline-none focus:border-[#c8960c]/60"
                  />
                </div>
                <div>
                  <label className="text-umurage-muted text-xs font-medium block mb-1">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a6754] text-xs">@</span>
                    <input
                      type="text" value={usernameField} onChange={e => setUsernameField(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      placeholder="username"
                      className="w-full bg-[#1a110a] border border-[#2d1e13] rounded-lg pl-7 pr-3 py-2 text-xs text-[#f2e6d8] placeholder-[#7a6754] focus:outline-none focus:border-[#c8960c]/60"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-umurage-muted text-xs font-medium block mb-1">Bio</label>
                <textarea
                  value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Tell your cultural story..."
                  rows={2}
                  className="w-full bg-[#1a110a] border border-[#2d1e13] rounded-lg px-3 py-2 text-xs text-[#f2e6d8] placeholder-[#7a6754] focus:outline-none focus:border-[#c8960c]/60 resize-none"
                />
              </div>
              <div>
                <label className="text-umurage-muted text-xs font-medium block mb-1">Location</label>
                <input
                  type="text" value={locField} onChange={e => setLocField(e.target.value)}
                  placeholder="e.g. Kigali, Rwanda"
                  className="w-full bg-[#1a110a] border border-[#2d1e13] rounded-lg px-3 py-2 text-xs text-[#f2e6d8] placeholder-[#7a6754] focus:outline-none focus:border-[#c8960c]/60"
                />
              </div>
              <div>
                <label className="text-umurage-muted text-xs font-medium block mb-2">Cultural Interests</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                        interests.includes(interest)
                          ? 'bg-umurage-gold/20 border-umurage-gold text-umurage-gold'
                          : 'border-umurage-border text-umurage-subtle hover:border-umurage-gold/40 hover:text-umurage-muted'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {profile.bio ? (
                <p className="text-umurage-muted text-sm leading-relaxed">{profile.bio}</p>
              ) : isOwnProfile ? (
                <p className="text-umurage-subtle text-sm italic">
                  No bio yet.{' '}
                  <button onClick={startEdit} className="text-umurage-gold hover:underline">Add one</button>
                </p>
              ) : null}
              {profile.location && (
                <div className="flex items-center gap-1.5 text-umurage-subtle text-xs">
                  <MapPin size={12} />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.interests && profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest: string) => (
                    <span key={interest} className="text-[10px] text-umurage-gold/70 bg-umurage-gold/8 border border-umurage-gold/15 px-2 py-0.5 rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
          </div>
        </div>

       {/* ── Tabs ── */}
      <div className="flex border-b border-umurage-border mb-6">
        {[
          { key: 'posts',   label: 'Posts',   icon: BookOpen, count: profile.posts_count ?? 0 },
          ...(isOwnProfile ? [{ key: 'saved', label: 'Saved', icon: Heart, count: null }] : []),
          { key: 'heritage', label: 'Heritage', icon: Archive, count: null },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
              activeTab === key ? 'text-umurage-gold border-umurage-gold' : 'text-umurage-muted border-transparent hover:text-umurage-cream'
            }`}
          >
            <Icon size={15} />
            {label}
            {count !== null && count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-umurage-gold/15 text-umurage-gold font-semibold">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Posts Tab ── */}
      {activeTab === 'posts' && (
        <div>
          {postsLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="text-umurage-gold animate-spin" /></div>
          ) : userPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-umurage-card border border-umurage-border flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-umurage-gold/50" />
              </div>
              <h3 className="text-umurage-cream font-semibold mb-2">No posts yet</h3>
              <p className="text-umurage-muted text-sm mb-4">
                {isOwnProfile
                  ? 'Share your first piece of cultural content.'
                  : `${displayName} hasn't published any posts yet.`}
              </p>
              {isOwnProfile && (
                <button onClick={() => navigate('/upload')} className="btn-gold px-6 py-2.5 text-sm">
                  Upload Content
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {userPosts.map((post: unknown) => (
                <ContentCard
                  key={(post as { id: string }).id}
                  item={post as Parameters<typeof ContentCard>[0]['item']}
                  likedSet={likedSet}
                  savedSet={savedSet}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Saved Tab ── */}
      {activeTab === 'saved' && isOwnProfile && (
        <div>
          {savedLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="text-umurage-gold animate-spin" /></div>
          ) : savedPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-umurage-card border border-umurage-border flex items-center justify-center mx-auto mb-4">
                <Heart size={24} className="text-umurage-gold/50" />
              </div>
              <h3 className="text-umurage-cream font-semibold mb-2">No saved content</h3>
              <p className="text-umurage-muted text-sm">Bookmark posts to find them here later.</p>
            </div>
          ) : (
            savedPosts.map((post: unknown) => (
              <ContentCard
                key={(post as { id: string }).id}
                item={post as Parameters<typeof ContentCard>[0]['item']}
                likedSet={likedSet}
                savedSet={savedSet}
              />
            ))
          )}
        </div>
      )}

      {/* ── Heritage Tab ── */}
      {activeTab === 'heritage' && (
        <div>
          {heritageLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="text-umurage-gold animate-spin" /></div>
          ) : heritageItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-umurage-card border border-umurage-border flex items-center justify-center mx-auto mb-4">
                <Archive size={24} className="text-umurage-gold/50" />
              </div>
              <h3 className="text-umurage-cream font-semibold mb-2">No heritage recordings</h3>
              <p className="text-umurage-muted text-sm mb-4">
                {isOwnProfile
                  ? 'Record oral stories, songs, or traditions for future generations.'
                  : `${displayName} hasn't added any heritage recordings yet.`}
              </p>
              {isOwnProfile && (
                <button onClick={() => navigate('/heritage-archive')} className="btn-gold px-6 py-2.5 text-sm">
                  Add Heritage Recording
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {(heritageItems as Record<string, unknown>[]).map(item => (
                <div key={item.id as string} className="umurage-card rounded-2xl p-5 animate-fade-in">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-umurage-cream font-semibold">{item.title as string}</h4>
                      {item.description && (
                        <p className="text-umurage-muted text-sm mt-1 line-clamp-2">{item.description as string}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] px-2.5 py-1 rounded-lg border border-umurage-gold/30 bg-umurage-gold/10 text-umurage-gold font-semibold">
                        {item.category as string}
                      </span>
                      {item.verified && (
                        <span className="flex items-center gap-1 text-[10px] text-green-400">
                          <CheckCircle size={10} /> Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-umurage-subtle mb-3">
                    {item.language && <span>🗣️ {item.language as string}</span>}
                    {item.region && <span>📍 {item.region as string}</span>}
                    {item.elder_name && <span>👤 Told by {item.elder_name as string}</span>}
                  </div>

                  {item.media_url && item.media_type === 'audio' && (
                    <audio src={item.media_url as string} controls className="w-full mt-2" />
                  )}
                  {item.media_url && item.media_type === 'video' && (
                    <video src={item.media_url as string} controls className="w-full mt-2 rounded-xl max-h-48" />
                  )}

                  {item.transcript && (
                    <div className="mt-3 p-3 bg-umurage-surface border border-umurage-border rounded-xl">
                      <p className="text-umurage-muted text-xs font-semibold mb-1">Transcript</p>
                      <p className="text-umurage-muted text-xs leading-relaxed line-clamp-3">{item.transcript as string}</p>
                    </div>
                  )}

                  {item.tags && (item.tags as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(item.tags as string[]).map(tag => (
                        <span key={tag} className="text-[10px] text-umurage-gold/70 bg-umurage-gold/8 border border-umurage-gold/15 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;