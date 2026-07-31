import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  email: string;
  bio: string;
  role: 'user' | 'creator' | 'elder' | 'organization' | 'student' | 'museum' | 'cultural_institution' | 'researcher' | 'tourist_guide' | 'community_member';
  verified: boolean;
  verifiedType?: string;
  followers: number;
  following: number;
  posts: number;
  location?: string;
  interests: string[];
  joinedAt: string;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  // OTP signup flow
  otpStep: 'idle' | 'otp-sent' | 'otp-verified';
  otpEmail: string;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (token: string) => Promise<void>;
  completeSignup: (name: string, username: string, password: string, role: string, phone?: string) => Promise<void>;
  // Direct password signup
  registerUser: (data: {
    full_name: string;
    username: string;
    email: string;
    phone_number: string;
    password: string;
    confirmPassword: string;
    role: string;
    acceptTerms: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  registerLoading: boolean;
  // Login (email/username/phone + password)
  loginWithPassword: (identifier: string, password: string) => Promise<void>;
  // Forgot password flow
  forgotPasswordStep: 'idle' | 'code-sent' | 'code-verified';
  forgotPasswordEmail: string;
  sendForgotPasswordCode: (identifier: string) => Promise<void>;
  verifyForgotPasswordCode: (token: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  resetForgotPasswordFlow: () => void;
  // Email-based password reset
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  // Logout
  logout: () => Promise<void>;
  // UI auth modal
  showAuthModal: boolean;
  authMode: 'login' | 'signup';
  openAuth: (mode: 'login' | 'signup') => void;
  closeAuth: () => void;
  // Profile update
  updateProfile: (updates: Partial<{
    bio: string; location: string; interests: string[]; phone: string; username: string;
  }>) => Promise<void>;
  // Avatar refresh
  refreshUser: () => Promise<void>;
}

function mapSupabaseUser(supaUser: SupabaseUser, profile?: Record<string, unknown> | null): AuthUser {
  const meta = supaUser.user_metadata || {};
  // Prefer profile data (source of truth for display name & avatar)
  return {
    id: supaUser.id,
    email: supaUser.email!,
    name: (profile?.username as string) || (meta.username as string) || (meta.full_name as string) || supaUser.email!.split('@')[0],
    username: (profile?.username as string) || (meta.username as string) || supaUser.email!.split('@')[0],
    avatar: (profile?.avatar_url as string) || (meta.avatar_url as string) || `https://api.dicebear.com/7.x/initials/svg?seed=${supaUser.email}`,
    bio: (profile?.bio as string) || '',
    role: ((profile?.role as string) || 'user') as AuthUser['role'],
    verified: (profile?.verified as boolean) || false,
    verifiedType: (profile?.verified_type as string) || undefined,
    followers: (profile?.followers_count as number) || 0,
    following: (profile?.following_count as number) || 0,
    posts: (profile?.posts_count as number) || 0,
    location: (profile?.location as string) || undefined,
    interests: (profile?.interests as string[]) || [],
    joinedAt: supaUser.created_at,
    phone: (profile?.phone as string) || undefined,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [otpStep, setOtpStep] = useState<'idle' | 'otp-sent' | 'otp-verified'>('idle');
  const [otpEmail, setOtpEmail] = useState('');
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'idle' | 'code-sent' | 'code-verified'>('idle');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  const fetchProfile = useCallback(async (supaUser: SupabaseUser): Promise<AuthUser> => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supaUser.id)
        .maybeSingle();
      return mapSupabaseUser(supaUser, profile);
    } catch {
      return mapSupabaseUser(supaUser, null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety #1: Check existing session on page load / refresh
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (mounted && session?.user) {
        const authUser = await fetchProfile(session.user);
        if (mounted) setUser(authUser);
      }
      if (mounted) setLoading(false);
    });

    // Safety #2: Listen to auth state changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        const authUser = await fetchProfile(session.user);
        setUser(authUser);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Silently refresh user data without resetting loading
        const authUser = await fetchProfile(session.user);
        setUser(authUser);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ── Refresh user profile (call after avatar/profile updates) ────────────
  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const authUser = await fetchProfile(session.user);
      setUser(authUser);
    }
  }, [fetchProfile]);

  // ── Resolve identifier to email ──────────────────────────────────────────
  const resolveToEmail = async (identifier: string): Promise<string> => {
    const trimmed = identifier.trim();
    if (trimmed.includes('@') && trimmed.includes('.')) return trimmed.toLowerCase();

    // Looks like a phone number
    const looksLikePhone = /^\+?\d{7,}$/.test(trimmed.replace(/[\s\-()]/g, ''));
    if (looksLikePhone) {
      const { data } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('phone', trimmed)
        .maybeSingle();
      if (data?.email) return data.email;
      throw new Error('No account found with that phone number. Try using your email instead.');
    }

    // Try username (strip leading @)
    const username = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
    const { data } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('username', username)
      .maybeSingle();
    if (data?.email) return data.email;
    throw new Error('No account found with that username. Try using your email address instead.');
  };

  // ── Step 1: Send signup OTP ──────────────────────────────────────────────
  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    if (error) {
      if (error.message.includes('rate')) throw new Error('Too many requests. Please wait a minute before trying again.');
      if (error.message.includes('invalid')) throw new Error('Please enter a valid email address.');
      throw error;
    }
    setOtpEmail(email.trim().toLowerCase());
    setOtpStep('otp-sent');
    toast.success('A 4-digit verification code has been sent to your email!');
  };

  // ── Step 2: Verify signup OTP ────────────────────────────────────────────
  const verifyOtp = async (token: string) => {
    const cleanToken = token.trim().replace(/\s/g, '');
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail,
      token: cleanToken,
      type: 'email',
    });
    if (error) {
      if (error.message.includes('expired')) throw new Error('Code expired. Please request a new one.');
      if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        throw new Error('Incorrect code. Please check your email and try again.');
      }
      throw error;
    }
    setOtpStep('otp-verified');
    toast.success('Email verified! ✓');
  };

  // ── Step 3: Complete signup ──────────────────────────────────────────────
  const completeSignup = async (name: string, username: string, password: string, role: string, phone?: string) => {
    // 1. Set password and store name in auth metadata
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password,
      data: { username: name, full_name: name },
    });
    if (updateError) throw updateError;

    if (updateData.user) {
      // 2. Upsert the full profile record (safe even if trigger already created it)
      const profileData: Record<string, unknown> = {
        id: updateData.user.id,
        email: updateData.user.email!,
        username,      // chosen @handle
        role,
      };
      if (phone) profileData.phone = phone;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile upsert error (non-fatal):', profileError);
      }

      const authUser = await fetchProfile(updateData.user);
      setUser(authUser);
    }

    setOtpStep('idle');
    setOtpEmail('');
    setShowAuthModal(false);
    toast.success('Welcome to Umurage Hub! 🇷🇼');
  };

  // ── Direct Password Registration ────────────────────────────────
  const registerUser = async (data: {
    full_name: string;
    username: string;
    email: string;
    phone_number: string;
    password: string;
    confirmPassword: string;
    role: string;
    acceptTerms: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    const { full_name, username, email, phone_number, password, confirmPassword, role, acceptTerms } = data;

    // Validation
    if (!full_name || !username || !email || !password || !confirmPassword || !role) {
      return { success: false, error: 'Please fill in all required fields.' };
    }
    if (!acceptTerms) {
      return { success: false, error: 'You must accept the Terms and Privacy Policy to continue.' };
    }
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return { success: false, error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores.' };
    }

    setRegisterLoading(true);
    try {
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle();

      if (existingProfile) {
        return { success: false, error: 'This username is already taken. Please choose a different one.' };
      }

      // Step 1: Create Supabase auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name,
            username: username.toLowerCase().trim(),
            phone_number: phone_number || null,
            role,
          },
        },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists')) {
          return { success: false, error: 'An account with this email already exists. Please log in instead.' };
        }
        if (msg.includes('weak password')) {
          return { success: false, error: 'Password is too weak. Use at least 6 characters.' };
        }
        return { success: false, error: signUpError.message };
      }

      if (!signUpData.user) {
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      // Step 2: Create profile record
      const profileData: Record<string, unknown> = {
        id: signUpData.user.id,
        full_name: full_name.trim(),
        username: username.toLowerCase().trim(),
        email: email.trim().toLowerCase(),
        phone_number: phone_number || null,
        role,
        verified: false,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Auth user was created but profile failed — this is non-fatal
        // The user can still log in but profile data may be incomplete
      }

      const authUser = await fetchProfile(signUpData.user);
      setUser(authUser);
      setRegisterLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setRegisterLoading(false);
      return { success: false, error: (err as Error).message || 'An unexpected error occurred.' };
    }
  };

  // ── Login: email | username | phone + password ───────────────────────────
  const loginWithPassword = async (identifier: string, password: string) => {
    // Resolve to email first (handles username/phone lookup)
    const email = await resolveToEmail(identifier);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password')) {
        throw new Error('Incorrect password. Please try again or use "Forgot password" to reset it.');
      }
      if (msg.includes('email not confirmed')) {
        throw new Error('Please verify your email first. Check your inbox for the verification code.');
      }
      if (msg.includes('too many')) {
        throw new Error('Too many login attempts. Please wait a few minutes and try again.');
      }
      throw new Error(error.message);
    }

    if (data.user) {
      const authUser = await fetchProfile(data.user);
      setUser(authUser);
      setShowAuthModal(false);
      toast.success(`Welcome back, ${authUser.name}! 🇷🇼`);
    }
  };

  // ── Forgot password: Step 1 — send code ─────────────────────────────────
  const sendForgotPasswordCode = async (identifier: string) => {
    const email = await resolveToEmail(identifier);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      if (error.message.includes('rate')) throw new Error('Too many requests. Please wait a minute before trying again.');
      if (error.message.includes('not found') || error.message.includes('no user')) {
        throw new Error('No account found with that email.');
      }
      throw error;
    }
    setForgotPasswordEmail(email);
    setForgotPasswordStep('code-sent');
    toast.success('A 4-digit verification code has been sent to your email!');
  };

  // ── Forgot password: Step 2 — verify code ───────────────────────────────
  const verifyForgotPasswordCode = async (token: string) => {
    const cleanToken = token.trim().replace(/\s/g, '');
    const { error } = await supabase.auth.verifyOtp({
      email: forgotPasswordEmail,
      token: cleanToken,
      type: 'email',
    });
    if (error) {
      if (error.message.includes('expired')) throw new Error('Code expired. Please request a new code.');
      if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        throw new Error('Incorrect code. Please check your email and try again.');
      }
      throw error;
    }
    setForgotPasswordStep('code-verified');
    toast.success('Identity verified! Set your new password.');
  };

  // ── Forgot password: Step 3 — set new password ──────────────────────────
  const resetPassword = async (newPassword: string) => {
    if (newPassword.length < 6) throw new Error('Password must be at least 6 characters');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setForgotPasswordStep('idle');
    setForgotPasswordEmail('');
    // Force re-login to sync new password across all devices
    await supabase.auth.signOut();
    toast.success('Password updated successfully! Please log in with your new password.');
  };

  const resetForgotPasswordFlow = () => {
    setForgotPasswordStep('idle');
    setForgotPasswordEmail('');
  };

  // ── Email-based password reset ──────────────────────────
  const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to send reset email.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (updates: Partial<{
    bio: string; location: string; interests: string[]; phone: string; username: string;
  }>) => {
    if (!user) return;
    const { error } = await supabase.from('user_profiles').update(updates).eq('id', user.id);
    if (error) throw error;
    // Also update auth metadata if username changed
    if (updates.username) {
      await supabase.auth.updateUser({ data: { username: updates.username } });
    }
    // Merge into local state immediately (no need to refetch)
    setUser(prev => prev ? {
      ...prev,
      bio: updates.bio ?? prev.bio,
      location: updates.location ?? prev.location,
      interests: updates.interests ?? prev.interests,
      phone: updates.phone ?? prev.phone,
      username: updates.username ?? prev.username,
      name: updates.username ?? prev.name,
    } : null);
    toast.success('Profile updated!');
  };

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setOtpStep('idle');
    setOtpEmail('');
    resetForgotPasswordFlow();
    setShowAuthModal(true);
  };

  const closeAuth = () => {
    setShowAuthModal(false);
    setOtpStep('idle');
    setOtpEmail('');
    resetForgotPasswordFlow();
  };

    return (
      <AuthContext.Provider value={{
        user, isAuthenticated: !!user, loading, registerLoading,
        otpStep, otpEmail,
        sendOtp, verifyOtp, completeSignup,
        registerUser,
        loginWithPassword,
        forgotPasswordStep, forgotPasswordEmail,
        sendForgotPasswordCode, verifyForgotPasswordCode, resetPassword, resetForgotPasswordFlow,
        sendPasswordResetEmail,
        logout,
        showAuthModal, authMode, openAuth, closeAuth,
        updateProfile,
        refreshUser,
      }}>
        {children}
      </AuthContext.Provider>
    );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
