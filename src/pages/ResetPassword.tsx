import React, { useState, useEffect } from 'react';
import {
  Eye, EyeOff, Loader2, Lock, ArrowLeft, Sparkles, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        // Check if there's an access token in the URL hash (Supabase redirect)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!sessionError) {
              setSessionReady(true);
            } else {
              setError('Invalid or expired reset link. Please request a new password reset.');
            }
          } else {
            setError('Invalid reset link. Please request a new password reset.');
          }
        } else {
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        toast.error(updateError.message);
      } else {
        setSuccess(true);
        toast.success('Password updated successfully!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to update password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputBase = 'w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(218,163,72,0.18),_transparent_24_),linear-gradient(135deg,_#140c06_0%,_#2b180d_55%,_#130a06_100%)] text-umurage-cream relative overflow-x-hidden">
      <div className="inyambo-bg" />
      <div className="fixed inset-0 imigongo-pattern pointer-events-none z-0 opacity-70" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_100%_0%,_rgba(218,163,72,0.14),_transparent_30%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
              <Sparkles className="text-umurage-gold group-hover:scale-110 transition-transform" size={28} />
              <span className="font-cinzel text-2xl text-umurage-gold font-bold tracking-wider">UMURAGE</span>
            </Link>
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold uppercase tracking-[0.3em] mb-2">Set New Password</h1>
            <p className="text-umurage-muted text-sm">Choose a strong password for your account</p>
          </div>

          {/* Form Card */}
          <div className="bg-[rgba(10,6,2,0.86)] border border-umurage-border/90 rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.38)] animate-fade-in backdrop-blur-sm">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-gradient-to-r from-umurage-gold to-umurage-gold-light shadow-[0_0_18px_rgba(200,150,12,0.45)]" />

            {!sessionReady ? (
              <div className="text-center py-8">
                <Loader2 size={32} className="text-umurage-gold animate-spin mx-auto mb-4" />
                <p className="text-umurage-muted text-sm">Verifying reset link...</p>
              </div>
            ) : error && !success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                  <Lock size={32} className="text-red-400" />
                </div>
                <h2 className="font-cinzel text-lg text-red-400 font-bold mb-2">Invalid Link</h2>
                <p className="text-umurage-muted text-sm mb-6">{error}</p>
                <Link to="/forgot-password" className="text-umurage-gold text-sm hover:underline">
                  Request a new reset link
                </Link>
              </div>
            ) : success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-umurage-gold/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} className="text-umurage-gold" />
                </div>
                <h2 className="font-cinzel text-xl text-umurage-gold font-bold mb-2">Password Updated</h2>
                <p className="text-umurage-muted text-sm mb-6">Your password has been changed successfully. Redirecting to login...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* New Password */}
                <div>
                  <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">New Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className={`${inputBase} pl-11 pr-12`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-umurage-subtle hover:text-umurage-cream transition-colors"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="h-1 rounded-full bg-umurage-surface overflow-hidden mt-2">
                      <div className={`h-full rounded-full transition-all ${
                        newPassword.length < 6 ? 'w-1/4 bg-red-500' :
                        newPassword.length < 10 ? 'w-2/4 bg-amber-400' : 'w-full bg-green-500'
                      }`} />
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      className={`${inputBase} pl-11 pr-12`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-umurage-subtle hover:text-umurage-cream transition-colors"
                    >
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-red-400 text-[11px] mt-1.5 ml-1">Passwords do not match</p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-xs text-center">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <span className="text-umurage-subtle text-sm">Back to </span>
            <Link to="/login" className="text-umurage-gold text-sm font-medium hover:text-umurage-gold-light transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
