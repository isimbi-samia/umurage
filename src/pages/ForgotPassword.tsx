import React, { useState } from 'react';
import {
  Eye, EyeOff, Loader2, Mail, ArrowLeft, Sparkles, ShieldCheck, Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

type Step = 'identifier' | 'code' | 'new-password';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const {
    sendForgotPasswordCode, verifyForgotPasswordCode, resetPassword, resetForgotPasswordFlow,
  } = useAuth();

  const [step, setStep] = useState<Step>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('Please enter your email, username, or phone number.');
      return;
    }
    setLoading(true);
    try {
      await sendForgotPasswordCode(identifier.trim());
      setStep('code');
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to send code.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code || code.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      await verifyForgotPasswordCode(code);
      setStep('new-password');
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Invalid code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
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
      await resetPassword(newPassword);
      setSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to update password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendForgotPasswordCode(identifier);
      toast.success('New code sent!');
    } catch {
      toast.error('Failed to resend code');
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
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold uppercase tracking-[0.3em] mb-2">
              {step === 'identifier' && 'Forgot Password'}
              {step === 'code' && 'Verify Code'}
              {step === 'new-password' && 'Set New Password'}
            </h1>
            <p className="text-umurage-muted text-sm">
              {step === 'identifier' && 'Enter your email, username, or phone to receive a reset code'}
              {step === 'code' && 'Enter the 6-digit code sent to your email'}
              {step === 'new-password' && 'Choose a strong new password for your account'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[rgba(10,6,2,0.86)] border border-umurage-border/90 rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.38)] animate-fade-in backdrop-blur-sm">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-gradient-to-r from-umurage-gold to-umurage-gold-light shadow-[0_0_18px_rgba(200,150,12,0.45)]" />

            {success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-umurage-gold/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} className="text-umurage-gold" />
                </div>
                <h2 className="font-cinzel text-xl text-umurage-gold font-bold mb-2">Password Updated</h2>
                <p className="text-umurage-muted text-sm">Redirecting to login...</p>
              </div>
            ) : (
              <>
                {/* Step 1: Identifier */}
                {step === 'identifier' && (
                  <form onSubmit={handleSendCode} className="space-y-5" noValidate>
                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Email, Username, or Phone</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                        <input
                          type="text"
                          value={identifier}
                          onChange={e => setIdentifier(e.target.value)}
                          placeholder="email@example.com, @username, or +250..."
                          className={`${inputBase} pl-11`}
                          autoFocus
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-xs text-center">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                      {loading ? 'Sending code...' : 'Send Verification Code'}
                    </button>
                  </form>
                )}

                {/* Step 2: OTP */}
                {step === 'code' && (
                  <form onSubmit={handleVerifyCode} className="space-y-5" noValidate>
                    <div className="bg-umurage-surface border border-umurage-border rounded-xl p-3 text-center mb-2">
                      <p className="text-umurage-muted text-xs">Code sent to</p>
                      <p className="text-umurage-gold text-sm font-semibold mt-0.5">{identifier}</p>
                    </div>

                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">6-Digit Verification Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="0 0 0 0 0 0"
                        maxLength={6}
                        className={`${inputBase} text-center text-3xl font-bold tracking-[0.3em]`}
                        autoFocus
                      />
                      <p className="text-umurage-subtle text-[10px] mt-1.5 text-center">Check your email inbox and spam folder</p>
                    </div>

                    {error && (
                      <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-xs text-center">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || code.length < 6}
                      className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </button>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => { setStep('identifier'); setCode(''); setError(''); }}
                        className="text-umurage-subtle text-xs hover:text-umurage-muted transition-colors py-1"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading}
                        className="text-umurage-gold text-xs hover:underline transition-colors py-1"
                      >
                        Resend code
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3: New Password */}
                {step === 'new-password' && (
                  <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
                    <div className="flex items-center gap-2 bg-green-900/20 border border-green-800/40 rounded-xl px-4 py-3 mb-2">
                      <ShieldCheck size={16} className="text-green-400 flex-shrink-0" />
                      <p className="text-green-300 text-xs">Identity verified! Set your new password below.</p>
                    </div>

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
                          autoFocus
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

                    <div>
                      <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Confirm New Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                        <input
                          type={showConfirmPw ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Repeat your new password"
                          className={`${inputBase} pl-11 pr-12`}
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

                    {error && (
                      <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-xs text-center">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !newPassword || newPassword !== confirmPassword}
                      className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                      {loading ? 'Updating...' : 'Set New Password'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStep('code'); setNewPassword(''); setConfirmPassword(''); setError(''); }}
                      className="w-full text-center text-umurage-subtle text-xs hover:text-umurage-muted transition-colors py-1"
                    >
                      ← Back to code
                    </button>
                  </form>
                )}
              </>
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