import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Lock, Globe, Shield, LogOut, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, LangCode } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const LANGUAGES: { code: LangCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'rw', label: 'Kinyarwanda', native: 'Ikinyarwanda' },
  { code: 'fr', label: 'French', native: 'Français' },
];

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [notifications, setNotifications] = useState({ newContent: true, messages: true, cultural_events: false, weekly: true });
  const [privacy, setPrivacy] = useState({ publicProfile: true, showActivity: false });

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setPwLoading(true);
    setPwSuccess(false);
    try {
      // Re-authenticate with current password first
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInErr) {
        toast.error('Current password is incorrect. Please try again.');
        setPwLoading(false);
        return;
      }
      // Now update to new password
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw updateErr;
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully! Please log in with your new password.');
      // Sign out so they re-login with new password (syncs across all devices)
      setTimeout(async () => { await logout(); }, 2000);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const toggle = (k: string) => setNotifications(n => ({ ...n, [k]: !n[k as keyof typeof n] }));
  const togglePrivacy = (k: string) => setPrivacy(p => ({ ...p, [k]: !p[k as keyof typeof p] }));

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-umurage-gold' : 'bg-umurage-border'}`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon size={22} className="text-umurage-gold" />
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">{t('nav.settings')}</h1>
        </div>
      </div>

      <div className="space-y-5">
        {/* Profile */}
          {user && (
          <div className="umurage-card rounded-2xl p-6">
            <h3 className="flex items-center gap-2 text-umurage-cream font-semibold mb-5">
              <User size={16} className="text-umurage-gold" /> Profile Settings
            </h3>
            <div className="flex items-center gap-4">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                alt={user.name}
                className="w-14 h-14 rounded-xl object-cover border-2 border-umurage-gold/30"
              />
              <div>
                <p className="text-umurage-cream font-medium">{user.name}</p>
                <p className="text-umurage-muted text-sm">@{user.username}</p>
                <p className="text-umurage-subtle text-xs capitalize">{user.role}</p>
              </div>
              <a href="/profile" className="ml-auto btn-outline-gold text-xs py-2 px-4">Edit Profile</a>
            </div>
          </div>
        )}

        {/* Language */}
        <div className="umurage-card rounded-2xl p-6">
          <h3 className="flex items-center gap-2 text-umurage-cream font-semibold mb-5">
            <Globe size={16} className="text-umurage-gold" /> Language & Region
          </h3>
          <div className="space-y-3">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all duration-200 ${
                  lang === l.code
                    ? 'border-umurage-gold/50 bg-umurage-gold/10'
                    : 'border-umurage-border hover:border-umurage-gold/25 hover:bg-umurage-surface'
                }`}
              >
                <div>
                  <span className="text-umurage-cream font-medium">{l.label}</span>
                  <span className="text-umurage-muted text-sm ml-2">— {l.native}</span>
                </div>
                {lang === l.code && (
                  <span className="w-5 h-5 rounded-full bg-umurage-gold flex items-center justify-center">
                    <span className="text-umurage-bg text-[10px] font-bold">✓</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="umurage-card rounded-2xl p-6">
          <h3 className="flex items-center gap-2 text-umurage-cream font-semibold mb-5">
            <Bell size={16} className="text-umurage-gold" /> Notifications
          </h3>
          <div className="space-y-4">
            {[
              { key: 'newContent', label: 'New cultural content', desc: 'When creators you follow post' },
              { key: 'messages', label: 'Messages & replies', desc: 'Comments and direct messages' },
              { key: 'cultural_events', label: 'Upcoming cultural events', desc: 'Cultural events and festivals' },
              { key: 'weekly', label: 'Weekly digest', desc: 'Top cultural content this week' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-umurage-cream text-sm font-medium">{item.label}</p>
                  <p className="text-umurage-subtle text-xs">{item.desc}</p>
                </div>
                <Toggle value={notifications[item.key as keyof typeof notifications]} onChange={() => toggle(item.key)} />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="umurage-card rounded-2xl p-6">
          <h3 className="flex items-center gap-2 text-umurage-cream font-semibold mb-5">
            <Shield size={16} className="text-umurage-gold" /> Privacy
          </h3>
          <div className="space-y-4">
            {[
              { key: 'publicProfile', label: 'Public profile', desc: 'Anyone can see your cultural contributions' },
              { key: 'showActivity', label: 'Show activity status', desc: 'Show when you\'re online' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-umurage-cream text-sm font-medium">{item.label}</p>
                  <p className="text-umurage-subtle text-xs">{item.desc}</p>
                </div>
                <Toggle value={privacy[item.key as keyof typeof privacy]} onChange={() => togglePrivacy(item.key)} />
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        {user && (
          <div className="umurage-card rounded-2xl p-6">
            <h3 className="flex items-center gap-2 text-umurage-cream font-semibold mb-5">
              <Lock size={16} className="text-umurage-gold" /> Change Password
            </h3>

            {pwSuccess ? (
              <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-700/40 rounded-xl">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-400 font-semibold text-sm">Password changed successfully!</p>
                  <p className="text-umurage-muted text-xs mt-0.5">Logging you out so you can sign in with your new password...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="text-umurage-muted text-xs font-medium block mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      required
                      className="w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 pr-11 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-umurage-subtle hover:text-umurage-muted transition-colors"
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-umurage-muted text-xs font-medium block mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className="w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 pr-11 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-umurage-subtle hover:text-umurage-muted transition-colors"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {newPassword && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            newPassword.length >= i * 3
                              ? newPassword.length >= 10 ? 'bg-green-500' : newPassword.length >= 7 ? 'bg-yellow-500' : 'bg-red-500'
                              : 'bg-umurage-border'
                          }`}
                        />
                      ))}
                      <span className="text-[10px] text-umurage-subtle ml-1">
                        {newPassword.length < 6 ? 'Too short' : newPassword.length < 8 ? 'Weak' : newPassword.length < 10 ? 'Fair' : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-umurage-muted text-xs font-medium block mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      className={`w-full bg-umurage-surface border rounded-xl px-4 py-3 pr-11 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none transition-colors ${
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-red-500/60 focus:border-red-500'
                          : confirmPassword && confirmPassword === newPassword
                          ? 'border-green-600/60 focus:border-green-600'
                          : 'border-umurage-border focus:border-umurage-gold/60'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-umurage-subtle hover:text-umurage-muted transition-colors"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="text-green-400 text-xs mt-1 flex items-center gap-1"><CheckCircle size={11} /> Passwords match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="btn-gold w-full py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pwLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  {pwLoading ? 'Updating Password...' : 'Update Password'}
                </button>

                <p className="text-umurage-subtle text-xs text-center">
                  After changing your password, you'll be signed out and asked to log in again with the new password.
                </p>
              </form>
            )}
          </div>
        )}

        {/* Logout */}
        {user && (
          <button
            onClick={async () => { await logout(); }}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-medium py-3"
          >
            <LogOut size={16} />
            {t('auth.logout')}
          </button>
        )}
      </div>
    </div>
  );
};

export default Settings;
