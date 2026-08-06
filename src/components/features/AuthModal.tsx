import React, { useState } from 'react';
import {
  X, Eye, EyeOff, Loader2, Mail, KeyRound, User, AtSign,
  ChevronRight, Phone, CheckCircle, ArrowLeft, ShieldCheck, Lock, GraduationCap, Camera, HandMetal,Building2, MapPin, BookOpen, Microscope, Users,Compass
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

type LoginView = 'login' | 'forgot';

const ACCOUNT_TYPES = [
  { value: 'student', label: 'Student', icon: GraduationCap },
  { value: 'creator', label: 'Creator', icon: Camera },
  { value: 'elder', label: 'Elder', icon: HandMetal },
  { value: 'organization', label: 'Organization', icon: Building2 },
  { value: 'museum', label: 'Museum', icon: MapPin },
  { value: 'cultural_institution', label: 'Cultural Institution', icon: BookOpen },
  { value: 'researcher', label: 'Researcher', icon: Microscope },
  { value: 'tourist_guide', label: 'Tourist Guide', icon: Compass },
  { value: 'community_member', label: 'Community Member', icon: Users },
];

const AuthModal: React.FC = () => {
  const {
    showAuthModal, authMode, closeAuth, openAuth,
    registerUser, registerLoading, loginWithPassword, sendPasswordResetEmail,
  } = useAuth();
  const { t } = useLanguage();

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginView, setLoginView] = useState<LoginView>('login');

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password
  const [fpEmail, setFpEmail] = useState('');
  const [fpSent, setFpSent] = useState(false);

  // Signup form
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signupError, setSignupError] = useState('');

  if (!showAuthModal) return null;

  const inp = "w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors";

  const resetAll = () => {
    setLoginIdentifier(''); setLoginPassword('');
    setFpEmail(''); setFpSent(false);
    setFullName(''); setUsername(''); setEmail(''); setPhone('');
    setPassword(''); setConfirmPassword(''); setRole(''); setAcceptTerms(false);
    setSignupError('');
    setShowPw(false); setShowConfirmPw(false);
    setLoginView('login');
  };

  const switchToLogin = () => { openAuth('login'); resetAll(); };
  const switchToSignup = () => { openAuth('signup'); resetAll(); };

  // ======================== LOGIN ========================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await loginWithPassword(loginIdentifier, loginPassword);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ======================== FORGOT PASSWORD ========================
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpEmail.trim()) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const result = await sendPasswordResetEmail(fpEmail);
      if (!result.success) {
        toast.error(result.error || 'Failed to send reset email');
      } else {
        setFpSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ======================== SIGNUP ========================
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!fullName.trim() || !username.trim() || !email.trim() || !password || !role) {
      setSignupError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) { setSignupError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setSignupError('Passwords do not match'); return; }
    if (!acceptTerms) { setSignupError('You must accept the Terms and Privacy Policy'); return; }

    const result = await registerUser({
      full_name: fullName,
      username,
      email,
      phone_number: phone || undefined,
      password,
      role,
    });

    if (!result.success) {
      setSignupError(result.error || 'Registration failed. Please try again.');
      toast.error(result.error || 'Registration failed');
      return;
    }

    toast.success('Welcome to Umurage Hub! 🇷🇼');
  };

  // ======================== HEADER TITLES ========================
  const getTitle = () => {
    if (authMode === 'signup') return 'Create Account';
    return loginView === 'forgot' ? 'Reset Password' : t('auth.loginTitle');
  };

  const getSubtitle = () => {
    if (authMode === 'signup') return "Join Rwanda's cultural heritage platform";
    return loginView === 'forgot' ? 'Enter your email and we will send you a reset link' : "Rwanda's Cultural Heritage Platform";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAuth} />

      <div className="auth-modal-card animate-fade-in overflow-y-auto">
        {/* Close */}
        <button onClick={closeAuth} className="absolute top-4 right-4 text-umurage-subtle hover:text-umurage-cream transition-colors z-10">
          <X size={20} />
        </button>

        {/* Back arrow for forgot-password */}
        {authMode === 'login' && loginView === 'forgot' && (
          <button
            onClick={() => { setLoginView('login'); setFpEmail(''); setFpSent(false); }}
            className="absolute top-4 left-4 text-umurage-subtle hover:text-umurage-cream transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-7">
          <h2 className="auth-modal-title">{getTitle()}</h2>
          <p className="auth-modal-subtitle">{getSubtitle()}</p>
        </div>

        {/* ========== LOGIN FORM ========== */}
        {authMode === 'login' && loginView === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5 auth-inner-card">
            <div>
              <label className="auth-input-label">Email, Username, or Phone</label>
              <div className="auth-input-wrapper">
                <AtSign size={15} className="auth-input-icon" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  placeholder="email@example.com, @username, or +250..."
                  className="auth-input pl-11"
                  autoComplete="username"
                />
                <span className="auth-circle-accent" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="auth-input-label">Password</label>
                <button
                  type="button"
                  onClick={() => { setLoginView('forgot'); setFpEmail(loginIdentifier.includes('@') ? loginIdentifier : ''); }}
                  className="text-umurage-gold text-xs hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="auth-input-wrapper">
                <KeyRound size={15} className="auth-input-icon" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input pl-11 pr-11"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="auth-toggle-btn">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <span className="auth-circle-accent" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full py-3 text-sm font-semibold mt-2 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ========== FORGOT PASSWORD ========== */}
        {authMode === 'login' && loginView === 'forgot' && (
          fpSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-umurage-gold/20 flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-umurage-gold" />
              </div>
              <p className="text-umurage-muted text-sm mb-2">We sent a password reset link to</p>
              <p className="text-umurage-cream text-sm font-semibold mb-6">{fpEmail}</p>
              <button onClick={() => { setLoginView('login'); resetAll(); }} className="text-umurage-gold text-sm hover:underline">
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <label className="text-umurage-muted text-xs font-medium block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                  <input
                    type="email"
                    value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={`${inp} pl-9`}
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setLoginView('login')} className="w-full text-center text-umurage-subtle text-xs hover:text-umurage-muted transition-colors py-1">
                ← Back to Sign In
              </button>
            </form>
          )
        )}

        {/* ========== SIGNUP FORM ========== */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Full Name *</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                <input
                  type="text" value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Vestine Uwimana"
                  className={`${inp} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Username *</label>
              <div className="relative">
                <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                <input
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                  placeholder="your_username"
                  className={`${inp} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={`${inp} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">
                Phone Number <span className="text-umurage-subtle font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                <input
                  type="tel" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+250 7XX XXX XXX"
                  className={`${inp} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Account Type *</label>
              <select value={role} onChange={e => setRole(e.target.value)} className={`${inp} appearance-none cursor-pointer`}>
                <option value="">Select your account type</option>
                {ACCOUNT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Password *</label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`${inp} pl-9 pr-10`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-umurage-subtle hover:text-umurage-muted transition-colors">
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
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Confirm Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                <input
                  type={showConfirmPw ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`${inp} pl-9 pr-10`}
                />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-umurage-subtle hover:text-umurage-muted transition-colors">
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-[10px] mt-1 ml-1">Passwords do not match</p>
              )}
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-umurage-border bg-umurage-surface text-umurage-gold focus:ring-umurage-gold/50 focus:ring-offset-0 cursor-pointer"
              />
              <label className="text-umurage-subtle text-xs leading-relaxed cursor-pointer">
                I agree to the <a href="#" className="text-umurage-gold hover:underline">Terms of Service</a> and <a href="#" className="text-umurage-gold hover:underline">Privacy Policy</a>
              </label>
            </div>
            {signupError && (
              <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-xs text-center">
                {signupError}
              </div>
            )}
            <button type="submit" disabled={registerLoading} className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2">
              {registerLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              {registerLoading ? 'Creating account...' : 'Join Umurage Hub 🇷🇼'}
            </button>
          </form>
        )}

        {/* Footer switch */}
        {(authMode === 'login' && loginView === 'login') || authMode === 'signup' ? (
          <div className="text-center mt-6">
            <span className="text-umurage-subtle text-sm">
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={authMode === 'login' ? switchToSignup : switchToLogin}
              className="text-umurage-gold text-sm font-medium hover:text-umurage-gold-light transition-colors"
            >
              {authMode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AuthModal;