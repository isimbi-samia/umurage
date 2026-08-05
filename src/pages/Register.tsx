import React, { useState, useCallback } from 'react';
import {
  Eye, EyeOff, Loader2, User, AtSign, Mail, Phone, Lock,
  ChevronRight, ShieldCheck, Sparkles, MapPin,
  BookOpen, Camera, Users, Building2, GraduationCap,
  Compass, HandMetal, Microscope,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

const ACCOUNT_TYPES = [
  { value: 'student', label: 'Student', icon: GraduationCap, description: 'Learning and exploring cultural heritage' },
  { value: 'creator', label: 'Creator', icon: Camera, description: 'Sharing cultural content and art' },
  { value: 'elder', label: 'Elder', icon: HandMetal, description: 'Keeper of traditional knowledge' },
  { value: 'organization', label: 'Organization', icon: Building2, description: 'Cultural institution or NGO' },
  { value: 'museum', label: 'Museum', icon: MapPin, description: 'Preserving and showcasing heritage' },
  { value: 'cultural_institution', label: 'Cultural Institution', icon: BookOpen, description: 'Academic or cultural body' },
  { value: 'researcher', label: 'Researcher', icon: Microscope, description: 'Studying cultural heritage' },
  { value: 'tourist_guide', label: 'Tourist Guide', icon: Compass, description: 'Sharing cultural experiences' },
  { value: 'community_member', label: 'Community Member', icon: Users, description: 'Active community participant' },
];

const Register: React.FC = () => {
  const { registerUser, registerLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    role: '',
    acceptTerms: false,
  });

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateField = useCallback((name: string, value: string) => {
    switch (name) {
      case 'full_name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'username':
        if (!value.trim()) return 'Username is required';
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(value.trim())) return 'Username must be 3-30 characters (letters, numbers, underscores)';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address';
        return '';
      case 'phone_number':
        if (value && !/^\+?\d{7,15}$/.test(value.replace(/[\s\-()]/g, ''))) return 'Please enter a valid phone number';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: checked }));

    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const newErrors: Record<string, string> = {};
    for (const field of ['full_name', 'username', 'email', 'password', 'confirmPassword', 'role'] as const) {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the Terms and Privacy Policy';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await registerUser({
      full_name: formData.full_name,
      username: formData.username,
      email: formData.email,
      phone_number: formData.phone_number,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: formData.role,
      acceptTerms: formData.acceptTerms,
    });

    if (!result.success) {
      setSubmitError(result.error || 'Registration failed. Please try again.');
      toast.error(result.error || 'Registration failed');
      return;
    }

    setSubmitSuccess(true);
    toast.success('Account created! Welcome to Umurage Hub 🇷🇼');
    setTimeout(() => navigate('/login'), 1500);
  };

  const inputBase = 'w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors';
  const errorBorder = 'border-red-500/60 focus:border-red-400/60';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(218,163,72,0.18),_transparent_24%),linear-gradient(135deg,_#140c06_0%,_#2b180d_55%,_#130a06_100%)] text-umurage-cream relative overflow-x-hidden">
      <div className="inyambo-bg" />
      <div className="fixed inset-0 imigongo-pattern pointer-events-none z-0 opacity-70" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_100%_0%,_rgba(218,163,72,0.14),_transparent_30%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
              <Sparkles className="text-umurage-gold group-hover:scale-110 transition-transform" size={28} />
              <span className="font-cinzel text-2xl text-umurage-gold font-bold tracking-wider">UMURAGE</span>
            </Link>
            <h1 className="font-cinzel text-3xl text-umurage-gold font-bold uppercase tracking-[0.3em] mb-2">Create Account</h1>
            <p className="text-umurage-muted text-sm">Join Rwanda's cultural heritage platform</p>
          </div>

          {/* Form Card */}
          <div className="bg-[rgba(10,6,2,0.86)] border border-umurage-border/90 rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.38)] animate-fade-in backdrop-blur-sm">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-gradient-to-r from-umurage-gold to-umurage-gold-light shadow-[0_0_18px_rgba(200,150,12,0.45)]" />

            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-umurage-gold/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} className="text-umurage-gold" />
                </div>
                <h2 className="font-cinzel text-xl text-umurage-gold font-bold mb-2">Account Created</h2>
                <p className="text-umurage-muted text-sm mb-6">Welcome to Umurage Hub! Redirecting to login...</p>
                <Link to="/login" className="text-umurage-gold text-sm hover:underline">Go to Login</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Full Name */}
                <div>
                  <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Full Name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="e.g. Vestine Uwimana"
                      className={`${inputBase} pl-11 ${errors.full_name ? errorBorder : ''}`}
                      autoComplete="name"
                    />
                  </div>
                  {errors.full_name && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.full_name}</p>}
                </div>

                {/* Username */}
                <div>
                  <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Username *</label>
                  <div className="relative">
                    <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="your_username"
                      className={`${inputBase} pl-11 pr-20 ${errors.username ? errorBorder : ''}`}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Email Address *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="your@email.com"
                      className={`${inputBase} pl-11 ${errors.email ? errorBorder : ''}`}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.email}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="+250 7XX XXX XXX"
                      className={`${inputBase} pl-11 ${errors.phone_number ? errorBorder : ''}`}
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone_number && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.phone_number}</p>}
                </div>

                {/* Account Type */}
                <div>
                  <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Account Type *</label>
                  <div className="relative">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`${inputBase} appearance-none cursor-pointer ${errors.role ? errorBorder : ''}`}
                    >
                      <option value="">Select your account type</option>
                      {ACCOUNT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <ChevronRight size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-umurage-subtle pointer-events-none" />
                  </div>
                  {errors.role && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.role}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="At least 6 characters"
                      className={`${inputBase} pl-11 pr-12 ${errors.password ? errorBorder : ''}`}
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
                  {formData.password && (
                    <div className="h-1 rounded-full bg-umurage-surface overflow-hidden mt-2">
                      <div className={`h-full rounded-full transition-all ${
                        formData.password.length < 6 ? 'w-1/4 bg-red-500' :
                        formData.password.length < 10 ? 'w-2/4 bg-amber-400' : 'w-full bg-green-500'
                      }`} />
                    </div>
                  )}
                  {errors.password && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-umurage-muted text-xs font-semibold uppercase tracking-[0.15em] mb-2 block">Confirm Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-umurage-subtle" />
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Repeat your password"
                      className={`${inputBase} pl-11 pr-12 ${errors.confirmPassword ? errorBorder : ''}`}
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
                  {errors.confirmPassword && <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.confirmPassword}</p>}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 rounded border-umurage-border bg-umurage-surface text-umurage-gold focus:ring-umurage-gold/50 focus:ring-offset-0 cursor-pointer"
                  />
                  <label className="text-umurage-subtle text-xs leading-relaxed cursor-pointer">
                    I agree to the <a href="#" className="text-umurage-gold hover:underline">Terms of Service</a> and <a href="#" className="text-umurage-gold hover:underline">Privacy Policy</a>
                  </label>
                </div>
                {errors.acceptTerms && <p className="text-red-400 text-[11px] ml-7">{errors.acceptTerms}</p>}

                {/* Submit Error */}
                {submitError && (
                  <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-xs text-center">
                    {submitError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="btn-gold w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
                >
                  {registerLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                  {registerLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <span className="text-umurage-subtle text-sm">Already have an account? </span>
            <Link to="/login" className="text-umurage-gold text-sm font-medium hover:text-umurage-gold-light transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
