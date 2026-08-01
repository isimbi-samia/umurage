import React, { useState } from 'react';
import {
  Eye, EyeOff, Loader2, User, AtSign, Mail, Phone, MapPin,
  ChevronRight, ArrowLeft, Sparkles, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const INTERESTS = [
  'History', 'Music', 'Dance', 'Arts', 'Language', 'Traditions',
  'Ceremonies', 'Oral Heritage', 'Literature', 'Nature',
];

const ACCOUNT_TYPES = [
  { value: 'student', label: 'Student' },
  { value: 'creator', label: 'Creator' },
  { value: 'elder', label: 'Elder' },
  { value: 'organization', label: 'Organization' },
  { value: 'museum', label: 'Museum' },
  { value: 'cultural_institution', label: 'Cultural Institution' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'tourist_guide', label: 'Tourist Guide' },
  { value: 'community_member', label: 'Community Member' },
];

const EditProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone_number: '',
    bio: '',
    location: '',
    interests: [] as string[],
    role: '',
  });

  const [showPw, setShowPw] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const inputBase = 'w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const uploadMedia = async (file: File, folder: string, userId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${folder}/${folder}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('umurage-media')
      .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('umurage-media').getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let avatarUrl = user?.avatar || null;
      let coverUrl = null;

      if (avatarFile) {
        setUploadingMedia(true);
        avatarUrl = await uploadMedia(avatarFile, 'avatar', user!.id);
      }
      if (coverFile) {
        setUploadingMedia(true);
        coverUrl = await uploadMedia(coverFile, 'cover', user!.id);
      }
      setUploadingMedia(false);

      const updates: Record<string, unknown> = {
        full_name: formData.full_name,
        username: formData.username,
        phone_number: formData.phone_number || null,
        bio: formData.bio || null,
        location: formData.location || null,
        interests: formData.interests,
        role: formData.role,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user!.id);

      if (profileError) throw profileError;

      // Update password if provided
      if (password) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) throw pwError;
      }

      await updateProfile({
        bio: formData.bio,
        location: formData.location,
        interests: formData.interests,
        phone: formData.phone_number,
        username: formData.username,
      });

      setSuccess(true);
      toast.success('Profile updated successfully!');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update profile');
      toast.error((err as Error).message || 'Failed to update profile');
    } finally {
      setLoading(false);
      setUploadingMedia(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(218,163,72,0.18),_transparent_24%),linear-gradient(135deg,_#140c06_0%,_#2b180d_55%,_#130a06_100%)] text-umurage-cream relative overflow-x-hidden">
      <div className="inyambo-bg" />
      <div className="fixed inset-0 imigongo-pattern pointer-events-none z-0 opacity-70" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_100%_0%,_rgba(218,163,72,0.14),_transparent_30%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <Link to="/profile" className="inline-flex items-center gap-2 mb-6 group">
              <ArrowLeft size={20} className="text-umurage-subtle group-hover:text-umurage-cream transition-colors" />
              <Sparkles className="text-umurage-gold group-hover:scale-110 transition-transform" size={28} />
              <span className="font-cinzel text-2xl text-umurage-gold font-bold tracking-wider">UMURAGE</span>
            </Link>
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold uppercase tracking-[0.3em] mb-2">Edit Profile</h1>
            <p className="text-umurage-muted text-sm">Update your profile information</p>
          </div>

          {/* Form Card */}
          <div className="bg-[rgba(10,6,2,0.86)] border border-umurage-border/90 rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.38)] animate-fade-in backdrop-blur-sm">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-gradient-to-r from-umurage-gold to-umurage-gold-light shadow-[0_0_18px_rgba(200,150,12,0.45)]" />

            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-umurage-gold/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} className="text-umurage-gold" />
                </div>
                <h2 className="font-cinzel text-xl text-umurage-gold font-bold mb-2">Profile Updated</h2>
                <p className="text-umurage-muted text-sm mb-6">Your profile has been saved successfully.</p>
                <Link to="/profile" className="text-umurage-gold text-sm hover:underline">View Profile</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Tabs */}
                <div className="flex border-b border-umurage-border mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === 'profile'
                        ? 'text-umurage-gold border-umurage-gold'
                        : 'text-umurage-muted border-transparent hover:text-umurage-cream'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('password')}
                    className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === 'password'
                        ? 'text-umurage-gold border-umurage-gold'
                        : 'text-umurage-muted border-transparent hover:text-umurage-cream'
                    }`}
                  >
                    Password
                  </button>
                </div>

                {activeTab === 'profile' ? (
                  <>
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-16 h-16 rounded-full bg-umurage-surface border border-umurage-border overflow-hidden flex-shrink-0">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-umurage-subtle">
                            <User size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-umurage-gold text-xs font-semibold uppercase tracking-wider cursor-pointer hover:underline">
                          Change Avatar
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                          />
                        </label>
                        <p className="text-umurage-subtle text-[10px] mt-1">JPG, PNG or GIF. Max 5MB.</p>
                      </div>
                    </div>

                    {/* Cover Image Upload */}
                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Cover Image</label>
                      <div className="relative h-20 bg-umurage-surface rounded-xl border border-umurage-border overflow-hidden flex items-center justify-center">
                        {coverFile ? (
                          <img
                            src={URL.createObjectURL(coverFile)}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <Image size={20} className="text-umurage-subtle mx-auto mb-1" />
                            <p className="text-umurage-subtle text-[10px]">Click to add cover image</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={e => setCoverFile(e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Full Name</label>
                      <div className="relative">
                        <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                        <input
                          type="text" name="full_name" value={formData.full_name}
                          onChange={handleChange} placeholder="e.g. Vestine Uwimana"
                          className={`${inputBase} pl-11`}
                        />
                      </div>
                    </div>

                    {/* Username */}
                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Username</label>
                      <div className="relative">
                        <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                        <input
                          type="text" name="username" value={formData.username}
                          onChange={handleChange} placeholder="your_username"
                          className={`${inputBase} pl-11`}
                        />
                      </div>
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Email</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                        <input
                          type="email" value={user?.email || ''} disabled
                          className={`${inputBase} pl-11 opacity-60 cursor-not-allowed`}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Phone Number</label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                        <input
                          type="tel" name="phone_number" value={formData.phone_number}
                          onChange={handleChange} placeholder="+250 7XX XXX XXX"
                          className={`${inputBase} pl-11`}
                        />
                      </div>
                    </div>

                    {/* Account Type */}
                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Account Type</label>
                      <div className="relative">
                        <select
                          name="role" value={formData.role}
                          onChange={handleChange}
                          className={`${inputBase} appearance-none cursor-pointer`}
                        >
                          <option value="">Select account type</option>
                          {ACCOUNT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                        <ChevronRight size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-umurage-subtle pointer-events-none" />
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Bio</label>
                      <textarea
                        name="bio" value={formData.bio}
                        onChange={handleChange} placeholder="Tell your cultural story..."
                        rows={3}
                        className={`${inputBase} resize-none`}
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Location</label>
                      <div className="relative">
                        <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                        <input
                          type="text" name="location" value={formData.location}
                          onChange={handleChange} placeholder="e.g. Kigali, Rwanda"
                          className={`${inputBase} pl-11`}
                        />
                      </div>
                    </div>

                    {/* Interests */}
                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Cultural Interests</label>
                      <div className="flex flex-wrap gap-2">
                        {INTERESTS.map(interest => (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                              formData.interests.includes(interest)
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
                  /* Password Tab */
                  <>
                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">New Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className={`${inputBase} pl-11 pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-umurage-subtle hover:text-umurage-cream transition-colors"
                        >
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {password && (
                        <div className="h-1 rounded-full bg-umurage-surface overflow-hidden mt-2">
                          <div className={`h-full rounded-full transition-all ${
                            password.length < 6 ? 'w-1/4 bg-red-500' :
                            password.length < 10 ? 'w-2/4 bg-amber-400' : 'w-full bg-green-500'
                          }`} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Confirm New Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Repeat your new password"
                          className={`${inputBase} pl-11`}
                        />
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-red-400 text-[11px] mt-1.5 ml-1">Passwords do not match</p>
                      )}
                    </div>
                  </>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-xs text-center">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || uploadingMedia}
                  className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
                >
                  {loading || uploadingMedia
                    ? <Loader2 size={16} className="animate-spin" />
                    : <ChevronRight size={16} />
                  }
                  {loading || uploadingMedia ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <Link to="/profile" className="text-umurage-subtle text-sm hover:text-umurage-cream transition-colors">
              Back to Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
