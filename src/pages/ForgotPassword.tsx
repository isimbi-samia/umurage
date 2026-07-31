import React, { useState } from 'react';
import {
  Eye, EyeOff, Loader2, Mail, ArrowLeft, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

const ForgotPassword: React.FC = () => {
  const { sendPasswordResetEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await sendPasswordResetEmail(email);
      if (!result.success) {
        setError(result.error || 'Failed to send reset email.');
        toast.error(result.error || 'Failed to send reset email.');
      } else {
        setSuccess(true);
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'An unexpected error occurred.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputBase = 'w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(218,163,72,0.18),_transparent_24%),linear-gradient(135deg,_#140c06_0%,_#2b180d_55%,_#130a06_100%)] text-umurage-cream relative overflow-x-hidden">
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
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold uppercase tracking-[0.3em] mb-2">Forgot Password</h1>
            <p className="text-umurage-muted text-sm">Enter your email and we will send you a reset link</p>
          </div>

          {/* Form Card */}
          <div className="bg-[rgba(10,6,2,0.86)] border border-umurage-border/90 rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.38)] animate-fade-in backdrop-blur-sm">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-gradient-to-r from-umurage-gold to-umurage-gold-light shadow-[0_0_18px_rgba(200,150,12,0.45)]" />

            {success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-umurage-gold/20 flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} className="text-umurage-gold" />
                </div>
                <h2 className="font-cinzel text-xl text-umurage-gold font-bold mb-2">Check Your Email</h2>
                <p className="text-umurage-muted text-sm mb-2">We sent a password reset link to</p>
                <p className="text-umurage-cream text-sm font-semibold mb-6">{email}</p>
                <p className="text-umurage-subtle text-xs mb-4">Did not receive the email? Check your spam folder or try again.</p>
                <button
                  onClick={() => { setSuccess(false); setEmail(''); }}
                  className="btn-outline-gold w-full py-3 text-sm font-semibold"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Email */}
                <div>
                  <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className={`${inputBase} pl-11`}
                      autoComplete="email"
                    />
                  </div>
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
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <span className="text-umurage-subtle text-sm">Remember your password? </span>
            <Link to="/login" className="text-umurage-gold text-sm font-medium hover:text-umurage-gold-light transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
