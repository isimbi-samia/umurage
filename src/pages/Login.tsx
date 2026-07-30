import React, { useState } from 'react';
import {
  Eye, EyeOff, Loader2, Mail, Lock,
  ChevronRight, Sparkles, AtSign, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { loginWithPassword } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await loginWithPassword(identifier.trim(), password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Login failed';
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
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold uppercase tracking-[0.3em] mb-2">Welcome Back</h1>
            <p className="text-umurage-muted text-sm">Sign in to your Umurage Hub account</p>
          </div>

          {/* Form Card */}
          <div className="bg-[rgba(10,6,2,0.86)] border border-umurage-border/90 rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.38)] animate-fade-in backdrop-blur-sm">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-gradient-to-r from-umurage-gold to-umurage-gold-light shadow-[0_0_18px_rgba(200,150,12,0.45)]" />

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Identifier */}
              <div>
                <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Email, Username, or Phone</label>
                <div className="relative">
                  <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="email@example.com, @username, or +250..."
                    className={`${inputBase} pl-11`}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em]">Password</label>
                  <Link to="/forgot-password" className="text-umurage-gold text-xs hover:underline transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputBase} pl-11 pr-12`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-umurage-subtle hover:text-umurage-cream transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <span className="text-umurage-subtle text-sm">Don't have an account? </span>
            <Link to="/register" className="text-umurage-gold text-sm font-medium hover:text-umurage-gold-light transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
