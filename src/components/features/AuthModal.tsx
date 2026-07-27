import React, { useState } from 'react';
import {
  X, Eye, EyeOff, Loader2, Mail, KeyRound, User, AtSign,
  ChevronRight, Phone, CheckCircle, ArrowLeft, ShieldCheck, Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

type SignupStep = 'email' | 'otp' | 'details';
type LoginView = 'login' | 'forgot-identifier' | 'forgot-otp' | 'forgot-newpw';

const AuthModal: React.FC = () => {
  const {
    showAuthModal, authMode, closeAuth, openAuth,
    sendOtp, verifyOtp, completeSignup, loginWithPassword,
    forgotPasswordStep, sendForgotPasswordCode, verifyForgotPasswordCode, resetPassword, resetForgotPasswordFlow,
    otpEmail, forgotPasswordEmail,
  } = useAuth();
  const { t } = useLanguage();

  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>('email');
  const [loginView, setLoginView] = useState<LoginView>('login');

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password
  const [fpIdentifier, setFpIdentifier] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Signup form
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');

  if (!showAuthModal) return null;

  const inp = "w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors";

  const resetAll = () => {
    setLoginIdentifier(''); setLoginPassword('');
    setFpIdentifier(''); setFpOtp(''); setNewPassword(''); setConfirmPassword('');
    setEmail(''); setOtp(''); setName(''); setUsername(''); setPassword(''); setPhone('');
    setShowPw(false); setShowNewPw(false);
    setLoginView('login'); setSignupStep('email');
    resetForgotPasswordFlow();
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
  const handleSendFpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpIdentifier.trim()) { toast.error('Please enter your email, username, or phone'); return; }
    setLoading(true);
    try {
      await sendForgotPasswordCode(fpIdentifier);
      setLoginView('forgot-otp');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpOtp || fpOtp.length < 4) { toast.error('Enter the 4-digit code'); return; }
    setLoading(true);
    try {
      await verifyForgotPasswordCode(fpOtp);
      setLoginView('forgot-newpw');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Invalid code. Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await resetPassword(newPassword);
      resetAll();
      setLoginView('login');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // ======================== SIGNUP ========================
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) { toast.error('Please enter a valid email'); return; }
    setLoading(true);
    try {
      await sendOtp(email);
      setSignupStep('otp');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) { toast.error('Please enter the verification code'); return; }
    setLoading(true);
    try {
      await verifyOtp(otp);
      setSignupStep('details');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Invalid code. Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await completeSignup(name, username, password, role, phone || undefined);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  // ======================== HEADER TITLES ========================
  const getTitle = () => {
    if (authMode === 'signup') {
      const signupTitles: Record<SignupStep, string> = { email: 'Create Account', otp: 'Verify Your Email', details: 'Complete Your Profile' };
      return signupTitles[signupStep];
    }
    const loginTitles: Record<LoginView, string> = {
      login: t('auth.loginTitle'),
      'forgot-identifier': 'Forgot Password',
      'forgot-otp': 'Enter Verification Code',
      'forgot-newpw': 'Set New Password',
    };
    return loginTitles[loginView];
  };

  const getSubtitle = () => {
    if (authMode === 'signup') {
      if (signupStep === 'email') return "Join Rwanda's cultural heritage platform";
      if (signupStep === 'otp') return `Code sent to ${email}`;
      return 'One last step — set up your profile';
    }
    if (loginView === 'forgot-identifier') return 'Enter your email, username, or phone to receive a reset code';
    if (loginView === 'forgot-otp') return `Code sent to ${forgotPasswordEmail}`;
    if (loginView === 'forgot-newpw') return 'Choose a strong new password for your account';
    return "Rwanda's Cultural Heritage Platform";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAuth} />

      <div className="auth-modal-card animate-fade-in overflow-y-auto">
        {/* Close */}
        <button onClick={closeAuth} className="absolute top-4 right-4 text-umurage-subtle hover:text-umurage-cream transition-colors z-10">
          <X size={20} />
        </button>

        {/* Back arrow for forgot-password steps */}
        {authMode === 'login' && loginView !== 'login' && (
          <button
            onClick={() => {
              if (loginView === 'forgot-otp') setLoginView('forgot-identifier');
              else if (loginView === 'forgot-newpw') setLoginView('forgot-otp');
              else setLoginView('login');
            }}
            className="absolute top-4 left-4 text-umurage-subtle hover:text-umurage-cream transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-7">
          <h2 className="auth-modal-title">{authMode === 'login' && loginView === 'login' ? 'WELCOME BACK' : getTitle()}</h2>
          <p className="auth-modal-subtitle">{authMode === 'login' && loginView === 'login' ? "Rwanda's Cultural Heritage Platform" : getSubtitle()}</p>
        </div>

        {/* Signup progress */}
        {authMode === 'signup' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['email', 'otp', 'details'] as SignupStep[]).map((step, i) => {
              const stepIdx = ['email', 'otp', 'details'].indexOf(signupStep);
              return (
                <React.Fragment key={step}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    signupStep === step ? 'bg-umurage-gold text-umurage-bg' :
                    stepIdx > i ? 'bg-umurage-gold/30 text-umurage-gold border border-umurage-gold/40' :
                    'bg-umurage-surface text-umurage-subtle border border-umurage-border'
                  }`}>
                    {stepIdx > i ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  {i < 2 && <div className={`w-8 h-px transition-all ${stepIdx > i ? 'bg-umurage-gold/50' : 'bg-umurage-border'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Forgot password progress */}
        {authMode === 'login' && loginView !== 'login' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['forgot-identifier', 'forgot-otp', 'forgot-newpw'] as LoginView[]).map((step, i) => {
              const stepIdx = ['forgot-identifier', 'forgot-otp', 'forgot-newpw'].indexOf(loginView);
              return (
                <React.Fragment key={step}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    loginView === step ? 'bg-umurage-gold text-umurage-bg' :
                    stepIdx > i ? 'bg-umurage-gold/30 text-umurage-gold border border-umurage-gold/40' :
                    'bg-umurage-surface text-umurage-subtle border border-umurage-border'
                  }`}>
                    {stepIdx > i ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  {i < 2 && <div className={`w-8 h-px transition-all ${stepIdx > i ? 'bg-umurage-gold/50' : 'bg-umurage-border'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

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
              <p className="auth-input-hint">You can sign in with your email, username, or phone number</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="auth-input-label">Password</label>
                <button
                  type="button"
                  onClick={() => { setLoginView('forgot-identifier'); setFpIdentifier(loginIdentifier); }}
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

        {/* ========== FORGOT: Step 1 — Enter identifier ========== */}
        {authMode === 'login' && loginView === 'forgot-identifier' && (
          <form onSubmit={handleSendFpCode} className="space-y-4">
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Email, Username, or Phone Number</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                <input
                  type="text"
                  value={fpIdentifier}
                  onChange={e => setFpIdentifier(e.target.value)}
                  placeholder="email@example.com, @username, or +250..."
                  className={`${inp} pl-9`}
                  autoFocus
                />
              </div>
              <p className="text-umurage-subtle text-[10px] mt-1.5 ml-1">We will send a 4-digit verification code to your registered email address</p>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {loading ? 'Sending code...' : 'Send Verification Code'}
            </button>
            <button type="button" onClick={() => setLoginView('login')} className="w-full text-center text-umurage-subtle text-xs hover:text-umurage-muted transition-colors py-1">
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* ========== FORGOT: Step 2 — Enter OTP ========== */}
        {authMode === 'login' && loginView === 'forgot-otp' && (
          <form onSubmit={handleVerifyFpCode} className="space-y-4">
            <div className="bg-umurage-surface border border-umurage-border rounded-xl p-3 text-center mb-2">
              <p className="text-umurage-muted text-xs">Code sent to</p>
              <p className="text-umurage-gold text-sm font-semibold mt-0.5">{forgotPasswordEmail}</p>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">4-Digit Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={fpOtp}
                onChange={e => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0 0 0 0"
                maxLength={4}
                className={`${inp} text-center text-3xl font-bold tracking-[0.5em]`}
                autoFocus
              />
              <p className="text-umurage-subtle text-[10px] mt-1.5 text-center">Check your email inbox and spam folder</p>
            </div>
            <button type="submit" disabled={loading || fpOtp.length < 4} className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  await sendForgotPasswordCode(fpIdentifier);
                  toast.success('New code sent!');
                } catch {
                  toast.error('Failed to resend code');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full text-center text-umurage-gold text-xs hover:underline transition-colors py-1"
            >
              Resend code
            </button>
          </form>
        )}

        {/* ========== FORGOT: Step 3 — New password ========== */}
        {authMode === 'login' && loginView === 'forgot-newpw' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center gap-2 bg-green-900/20 border border-green-800/40 rounded-xl px-4 py-3 mb-2">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-xs">Identity verified! Set your new password below.</p>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`${inp} pl-9 pr-10`}
                  autoFocus
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-umurage-subtle hover:text-umurage-muted transition-colors">
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className={`${inp} pl-9`}
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-400 text-[10px] mt-1 ml-1">Passwords do not match</p>
              )}
            </div>
            {/* Password strength hint */}
            <div className="h-1.5 rounded-full bg-umurage-surface overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  newPassword.length === 0 ? 'w-0' :
                  newPassword.length < 6 ? 'w-1/4 bg-red-500' :
                  newPassword.length < 10 ? 'w-2/4 bg-amber-400' :
                  newPassword.length < 14 ? 'w-3/4 bg-green-400' :
                  'w-full bg-green-500'
                }`}
              />
            </div>
            <p className="text-umurage-subtle text-[10px]">
              {newPassword.length === 0 ? '' : newPassword.length < 6 ? 'Too short' : newPassword.length < 10 ? 'Fair' : newPassword.length < 14 ? 'Good' : 'Strong'}
            </p>
            <button
              type="submit"
              disabled={loading || !newPassword || newPassword !== confirmPassword}
              className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {loading ? 'Updating password...' : 'Set New Password'}
            </button>
          </form>
        )}

        {/* ========== SIGNUP STEP 1: Email ========== */}
        {authMode === 'signup' && signupStep === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
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
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Account Type</label>
              <select value={role} onChange={e => setRole(e.target.value)} className={`${inp} appearance-none cursor-pointer`}>
                <option value="user">🌍 Cultural Learner</option>
                <option value="creator">🎨 Cultural Creator</option>
                <option value="elder">🌿 Elder / Knowledge Keeper</option>
                <option value="organization">🏛️ Organization / Institution</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              {loading ? 'Sending code...' : 'Send Verification Code'}
            </button>
            <p className="text-umurage-subtle text-xs text-center">We will send a 4-digit code to verify your email</p>
          </form>
        )}

        {/* ========== SIGNUP STEP 2: OTP ========== */}
        {authMode === 'signup' && signupStep === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="bg-umurage-surface border border-umurage-border rounded-xl p-3 text-center mb-2">
              <p className="text-umurage-muted text-xs">Code sent to</p>
              <p className="text-umurage-gold text-sm font-semibold mt-0.5">{email}</p>
              <p className="text-umurage-subtle text-[10px] mt-1.5">Check your inbox and spam/junk folder. The code expires in 1 hour.</p>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">4-Digit Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0 0 0 0"
                maxLength={4}
                className={`${inp} text-center text-3xl font-bold tracking-[0.5em]`}
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading || otp.length < 4} className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => { setSignupStep('email'); setOtp(''); }} className="text-umurage-subtle text-xs hover:text-umurage-muted transition-colors py-1">
                ← Use a different email
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try { await sendOtp(email); toast.success('New code sent!'); } catch { toast.error('Failed to resend'); } finally { setLoading(false); }
                }}
                className="text-umurage-gold text-xs hover:underline transition-colors py-1"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {/* ========== SIGNUP STEP 3: Details ========== */}
        {authMode === 'signup' && signupStep === 'details' && (
          <form onSubmit={handleCompleteSignup} className="space-y-4">
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Full Name *</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                <input
                  type="text" value={name}
                  onChange={e => setName(e.target.value)}
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
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">
                Phone Number <span className="text-umurage-subtle font-normal">(optional — for account recovery)</span>
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
              <p className="text-umurage-subtle text-[10px] mt-1 ml-1">Adding a phone number lets you log in and recover your account with it</p>
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
              {/* Password strength */}
              <div className="h-1 rounded-full bg-umurage-surface overflow-hidden mt-2">
                <div className={`h-full rounded-full transition-all ${
                  password.length === 0 ? 'w-0' : password.length < 6 ? 'w-1/4 bg-red-500' :
                  password.length < 10 ? 'w-2/4 bg-amber-400' : 'w-full bg-green-500'
                }`} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Creating account...' : 'Join Umurage Hub 🇷🇼'}
            </button>
          </form>
        )}

        {/* Footer switch — only show on main views */}
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
