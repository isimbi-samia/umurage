import React, { useState } from 'react';
import {
  X, Eye, EyeOff, Loader2, Mail, KeyRound, User, AtSign,
  ChevronRight, Phone, ArrowLeft, Lock, GraduationCap, Camera, HandMetal, Building2, MapPin, BookOpen, Microscope, Users, Compass
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

  const inpClass = "w-full bg-[#1a110a] border border-[#2d1e13] rounded-lg px-3.5 py-2.5 text-xs text-[#f2e6d8] placeholder-[#7a6754] focus:outline-none focus:border-[#c8960c]/60 transition-colors";

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

    toast.success('Welcome to Umurage Hub!');
  };

  const getTitle = () => {
    if (authMode === 'signup') return 'Create Account';
    return loginView === 'forgot' ? 'Reset Password' : t('auth.loginTitle');
  };

  const getSubtitle = () => {
    if (authMode === 'signup') return "Join Rwanda's cultural heritage platform";
    return loginView === 'forgot' ? 'Enter your email to receive a password reset link' : "Preserve. Connect. Celebrate.";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" onClick={closeAuth} />

      <div className="relative w-full max-w-md rounded-xl border border-[#2d1e13] bg-[#140d08] p-6 shadow-2xl z-10 animate-fade-in max-h-[90vh] overflow-y-auto">
        <button onClick={closeAuth} className="absolute top-4 right-4 text-[#8c7662] hover:text-[#f2e6d8] transition-colors">
          <X size={18} />
        </button>

        {authMode === 'login' && loginView === 'forgot' && (
          <button
            onClick={() => { setLoginView('login'); setFpEmail(''); setFpSent(false); }}
            className="absolute top-4 left-4 text-[#8c7662] hover:text-[#f2e6d8] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <div className="text-center mb-6">
          <h2 className="font-cinzel text-lg font-bold text-[#d4a24c] mb-1">{getTitle()}</h2>
          <p className="text-xs text-[#a89078]">{getSubtitle()}</p>
        </div>

        {/* LOGIN FORM */}
        {authMode === 'login' && loginView === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-[#a89078] font-medium block mb-1">Email, Username, or Phone</label>
              <div className="relative">
                <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c7662]" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  placeholder="email@example.com, @username, or phone..."
                  className={`${inpClass} pl-9`}
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#a89078] font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => { setLoginView('forgot'); setFpEmail(loginIdentifier.includes('@') ? loginIdentifier : ''); }}
                  className="text-[#d4a24c] text-xs hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c7662]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inpClass} pl-9 pr-9`}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7662] hover:text-[#f2e6d8]">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full py-2.5 text-xs font-semibold mt-2">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {authMode === 'login' && loginView === 'forgot' && (
          fpSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[#24170d] flex items-center justify-center mx-auto mb-3 text-[#d4a24c]">
                <Mail size={24} />
              </div>
              <p className="text-xs text-[#a89078] mb-1">Password reset link sent to</p>
              <p className="text-xs font-semibold text-[#f2e6d8] mb-4">{fpEmail}</p>
              <button onClick={() => { setLoginView('login'); resetAll(); }} className="text-[#d4a24c] text-xs hover:underline">
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendResetEmail} className="space-y-3.5">
              <div>
                <label className="text-xs text-[#a89078] font-medium block mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c7662]" />
                  <input
                    type="email"
                    value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={`${inpClass} pl-9`}
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full py-2.5 text-xs font-semibold">
                {loading ? <Loader2 size={15} className="animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          )
        )}

        {/* SIGNUP FORM */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="text-xs text-[#a89078] font-medium block mb-1">Full Name *</label>
              <input
                type="text" value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Vestine Uwimana"
                className={inpClass}
              />
            </div>
            <div>
              <label className="text-xs text-[#a89078] font-medium block mb-1">Username *</label>
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                placeholder="username"
                className={inpClass}
              />
            </div>
            <div>
              <label className="text-xs text-[#a89078] font-medium block mb-1">Email Address *</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={inpClass}
              />
            </div>
            <div>
              <label className="text-xs text-[#a89078] font-medium block mb-1">Phone Number (optional)</label>
              <input
                type="tel" value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+250 7XX XXX XXX"
                className={inpClass}
              />
            </div>
            <div>
              <label className="text-xs text-[#a89078] font-medium block mb-1">Account Type *</label>
              <select value={role} onChange={e => setRole(e.target.value)} className={`${inpClass} appearance-none cursor-pointer`}>
                <option value="">Select account type</option>
                {ACCOUNT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#a89078] font-medium block mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`${inpClass} pr-9`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7662] hover:text-[#f2e6d8]">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-[#a89078] font-medium block mb-1">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className={`${inpClass} pr-9`}
                />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7662] hover:text-[#f2e6d8]">
                  {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 rounded border-[#2d1e13] bg-[#1a110a] text-[#c8960c] cursor-pointer"
              />
              <label className="text-[#a89078] text-xs leading-tight cursor-pointer">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
            {signupError && (
              <p className="text-red-400 text-xs text-center">{signupError}</p>
            )}
            <button type="submit" disabled={registerLoading} className="btn-gold w-full py-2.5 text-xs font-semibold mt-2">
              {registerLoading ? <Loader2 size={15} className="animate-spin" /> : 'Create Account'}
            </button>
          </form>
        )}

        {/* Footer switch */}
        {(authMode === 'login' && loginView === 'login') || authMode === 'signup' ? (
          <div className="text-center mt-5 pt-3 border-t border-[#25180e]">
            <span className="text-[#a89078] text-xs">
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={authMode === 'login' ? switchToSignup : switchToLogin}
              className="text-[#d4a24c] text-xs font-medium hover:underline ml-1"
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