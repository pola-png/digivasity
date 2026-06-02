import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Loader2,
  Globe,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  auth,
  confirmPasswordReset,
  createUserDocument,
  createUserWithEmailAndPassword,
  getRecoveryRedirectUrl,
  getVerificationRedirectUrl,
  refreshCurrentUser,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithGoogle,
  updateProfile,
  verifyEmail,
} from '../lib/appwrite';
import { cn } from '../lib/utils';

interface AuthProps {
  onSuccess: () => void;
  onBack?: () => void;
  initialMode?: 'login' | 'register' | 'verify' | 'forgot' | 'reset-password';
}

type Mode = NonNullable<AuthProps['initialMode']>;

export const Auth: React.FC<AuthProps> = ({ onSuccess, onBack, initialMode = 'login' }) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSecret, setResetSecret] = useState('');
  const [resetUserId, setResetUserId] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    email: '',
    password: '',
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const latestOnSuccess = useRef(onSuccess);
  const handledVerificationToken = useRef<string | null>(null);

  const verificationUrl = useMemo(() => getVerificationRedirectUrl(), []);
  const recoveryUrl = useMemo(() => getRecoveryRedirectUrl(), []);
  const getVerificationStorageKey = (verificationKey: string) => `digivasity:email-verification:${verificationKey}`;

  useEffect(() => {
    latestOnSuccess.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    const userId = params.get('userId');
    const secret = params.get('secret');
    const authMode = params.get('auth');

    if (urlMode === 'resetPassword' && userId && secret) {
      setMode('reset-password');
      setResetUserId(userId);
      setResetSecret(secret);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (urlMode === 'verifyEmail' && userId && secret) {
      const verificationKey = `${userId}:${secret}`;
      const storageKey = getVerificationStorageKey(verificationKey);
      const alreadyHandled =
        handledVerificationToken.current === verificationKey ||
        (typeof window !== 'undefined' && window.sessionStorage.getItem(storageKey) === '1');

      if (alreadyHandled) {
        return;
      }

      handledVerificationToken.current = verificationKey;
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(storageKey, '1');
      }
      setMode('verify');
      setEmailLoading(true);
      setError(null);
      setStatus(null);

      void (async () => {
        try {
          await verifyEmail(userId, secret);
          const current = await refreshCurrentUser();
          if (current) {
            await createUserDocument(current);
            setStatus('Your email has been verified. You can continue now.');
            latestOnSuccess.current();
          } else {
            setStatus('Your email has been verified. You can sign in now.');
            setMode('login');
          }
        } catch (err: any) {
          const message = err?.message || 'Verification link is invalid or has expired.';
          const current = await refreshCurrentUser();
          if (current?.emailVerified) {
            await createUserDocument(current);
            setStatus('Your email is already verified. You can continue now.');
            latestOnSuccess.current();
            return;
          }

          setError(message);
        } finally {
          setEmailLoading(false);
        }
      })();

      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (authMode === 'google') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (authMode === 'google-error') {
      setError('Google sign-in was cancelled or failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const current = auth.currentUser;
    if (current && !current.emailVerified) {
      setMode('verify');
    }
  }, [initialMode]);

  const goBack = () => {
    setError(null);
    setStatus(null);
    setMode('login');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setError(null);
    setStatus(null);

    try {
      if (!recoveryUrl) {
        throw new Error('Set VITE_APPWRITE_RECOVERY_URL to your production reset-password URL.');
      }
      await sendPasswordResetEmail(forgotEmail, recoveryUrl);
      setStatus(`We sent a password reset link to ${forgotEmail}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to send password reset email.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setError(null);
    setStatus(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setEmailLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setEmailLoading(false);
      return;
    }

    try {
      await confirmPasswordReset(resetUserId, resetSecret, newPassword);
      setStatus('Your password has been reset successfully.');
      setMode('login');
      setNewPassword('');
      setConfirmPassword('');
      setResetSecret('');
      setResetUserId('');
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setError(null);
    setStatus(null);

    try {
      if (mode === 'register') {
        if (!verificationUrl) {
          throw new Error('Set VITE_APPWRITE_VERIFY_URL to your production email verification URL.');
        }

        const result = await createUserWithEmailAndPassword(
          formData.email,
          formData.password,
          formData.fullName,
        );

        if (result.user) {
          await updateProfile(result.user, { displayName: formData.fullName });

          try {
            await createUserDocument(result.user, {
              fullName: formData.fullName,
              whatsapp: formData.whatsapp,
            });
          } catch (profileError: any) {
            throw new Error(
              `User profile document write failed: ${profileError?.message || String(profileError)}`,
            );
          }

          try {
            await sendEmailVerification(verificationUrl);
          } catch (verificationError: any) {
            throw new Error(
              `Verification email request failed: ${verificationError?.message || String(verificationError)}`,
            );
          }

          setMode('verify');
          setStatus('Registration complete. Check your email to verify your account.');
        }
      } else {
        const result = await signInWithEmailAndPassword(formData.email, formData.password);
        if (!result.user) {
          throw new Error('Unable to sign you in right now.');
        }

        await createUserDocument(result.user);

        if (!result.user.emailVerified) {
          setMode('verify');
          setStatus('Please verify your email before logging in.');
          return;
        }
        onSuccess();
      }
    } catch (err: any) {
      const message = err?.message || 'An unexpected error occurred.';
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown origin';
      const appwriteCode = typeof err?.code === 'number' ? ` [code ${err.code}]` : '';
      const appwriteType = err?.type ? ` [type ${err.type}]` : '';
      const rawDetails = `${message}${appwriteCode}${appwriteType}`;
      if (message.toLowerCase().includes('failed to fetch')) {
        setError(
          'Failed to reach Appwrite. Check VITE_APPWRITE_ENDPOINT, your Appwrite Web platform origin, and that the FRA project endpoint matches your console.',
        );
      } else if (message.toLowerCase().includes('network request failed')) {
        setError(
          'Network request failed. Check that your Appwrite endpoint is reachable and your site origin is added in Appwrite Console.',
        );
      } else if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('not allowed')) {
        setError(
          `Appwrite blocked this request from ${currentOrigin}. Raw error: ${rawDetails}. If you already added this origin, the failing step is likely the user profile document write or verification email request, not the platform entry.`,
        );
      } else if (message.toLowerCase().includes('email already exists')) {
        setError('An account with this email already exists. Please log in instead.');
      } else {
        setError(rawDetails);
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);
    setStatus(null);

    try {
      signInWithGoogle();
    } catch (err: any) {
      setGoogleLoading(false);
      const message = err?.message || 'Google sign-in failed.';
      if (message.toLowerCase().includes('failed to fetch')) {
        setError(
          'Failed to reach Appwrite during Google login. Check the endpoint, your Appwrite Web platform origin, and that the Google OAuth provider is enabled.',
        );
      } else {
        setError(message);
      }
    }
  };

  const resendVerification = async () => {
    setEmailLoading(true);
    setError(null);
    setStatus(null);

    try {
      if (!verificationUrl) {
        throw new Error('Set VITE_APPWRITE_VERIFY_URL to your production email verification URL.');
      }
      await sendEmailVerification(verificationUrl);
      setStatus('A fresh verification email has been sent.');
    } catch (err: any) {
      setError(err?.message || 'Could not resend verification email.');
    } finally {
      setEmailLoading(false);
    }
  };

  if (mode === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#2D1B14]">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#4A2C21] rounded-[40px] p-10 border border-white/10 shadow-2xl text-center"
        >
          <div className="w-20 h-20 bg-brand-orange/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="text-brand-orange w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Verify Your Email</h2>

          <AnimatePresence mode="wait">
            {(error || status) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  'mb-6 rounded-2xl p-4 flex items-center gap-3 text-sm font-medium text-left',
                  error
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : 'bg-green-500/10 border border-green-500/20 text-green-400',
                )}
              >
                {error ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
                <span>{error || status}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-white/60 mb-8 leading-relaxed">
            Check your inbox and verify the email address tied to your Digivasity account.
          </p>

          <button
            type="button"
            onClick={resendVerification}
            disabled={emailLoading}
            className="w-full bg-brand-orange hover:bg-brand-orange-light text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center disabled:opacity-50 transition-all shadow-lg shadow-brand-orange/20 uppercase tracking-widest"
          >
            {emailLoading ? <Loader2 className="animate-spin" /> : 'Resend Verification Email'}
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-4 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all block w-full py-2 border border-white/5 rounded-xl hover:bg-white/5"
            >
              Back to Home
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#2D1B14]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-brand-orange rounded-2xl flex items-center justify-center shadow-xl shadow-brand-orange/20">
              <Globe className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            {mode === 'login' ? 'WELCOME BACK' : mode === 'forgot' ? 'FORGOT PASSWORD' : mode === 'reset-password' ? 'RESET PASSWORD' : 'GET STARTED'}
          </h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
            {mode === 'login' ? 'Login to your account' : mode === 'forgot' ? 'Request a reset link' : mode === 'reset-password' ? 'Set up a new secure password' : 'Create your Digivasity account'}
          </p>
        </div>

        <div className="bg-[#4A2C21] rounded-[40px] p-8 md:p-10 border border-white/10 shadow-2xl">
          {mode === 'register' && (
            <div className="mb-6 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl p-4 flex items-center gap-3 text-brand-orange text-xs font-bold uppercase tracking-wider">
              <Sparkles size={16} className="shrink-0" />
              Register to get personalized assistance
            </div>
          )}

          {mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <AnimatePresence mode="wait">
                {(error || status) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      'rounded-2xl p-4 flex items-center gap-3 text-sm font-medium',
                      error
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                        : 'bg-green-500/10 border border-green-500/20 text-green-400',
                    )}
                  >
                    {error ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
                    {error || status}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5 flex flex-col items-start w-full">
                <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-4">Email Address</label>
                <div className="relative w-full">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#2D1B14] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full bg-brand-orange hover:bg-brand-orange-light text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center disabled:opacity-50 transition-all shadow-lg shadow-brand-orange/20 uppercase tracking-widest mt-4"
              >
                {emailLoading ? <Loader2 className="animate-spin" /> : (
                  <>
                    Send Reset Link
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : mode === 'reset-password' ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <AnimatePresence mode="wait">
                {(error || status) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      'rounded-2xl p-4 flex items-center gap-3 text-sm font-medium',
                      error
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                        : 'bg-green-500/10 border border-green-500/20 text-green-400',
                    )}
                  >
                    {error ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
                    {error || status}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5 flex flex-col items-start w-full">
                <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-4">New Password</label>
                <div className="relative w-full">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#2D1B14] border border-white/5 rounded-2xl py-4 pl-14 pr-14 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col items-start w-full">
                <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-4">Confirm New Password</label>
                <div className="relative w-full">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#2D1B14] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full bg-brand-orange hover:bg-brand-orange-light text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center disabled:opacity-50 transition-all shadow-lg shadow-brand-orange/20 uppercase tracking-widest mt-4"
              >
                {emailLoading ? <Loader2 className="animate-spin" /> : (
                  <>
                    Save New Password
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <AnimatePresence mode="wait">
                {(error || status) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      'rounded-2xl p-4 flex items-center gap-3 text-sm font-medium',
                      error
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                        : 'bg-green-500/10 border border-green-500/20 text-green-400',
                    )}
                  >
                    {error ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
                    {error || status}
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'register' && (
                <>
                  <div className="space-y-1.5 flex flex-col items-start w-full">
                    <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-4">Full Name</label>
                    <div className="relative w-full">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="w-full bg-[#2D1B14] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 flex flex-col items-start w-full">
                    <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-4">WhatsApp Number</label>
                    <div className="relative w-full">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="+234..."
                        className="w-full bg-[#2D1B14] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/10"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5 flex flex-col items-start w-full">
                <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest ml-4">Email Address</label>
                <div className="relative w-full">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full bg-[#2D1B14] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col items-start w-full">
                <div className="flex justify-between items-center px-4 w-full">
                  <label className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setStatus(null);
                        setMode('forgot');
                      }}
                      className="text-[10px] font-bold text-white/40 hover:text-brand-orange uppercase tracking-widest transition-colors focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative w-full">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#2D1B14] border border-white/5 rounded-2xl py-4 pl-14 pr-14 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all placeholder:text-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={emailLoading || googleLoading}
                className="w-full bg-brand-orange hover:bg-brand-orange-light text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center disabled:opacity-50 transition-all shadow-lg shadow-brand-orange/20 uppercase tracking-widest mt-4"
              >
                {emailLoading ? <Loader2 className="animate-spin" /> : (
                  <>
                    {mode === 'login' ? 'Login to Dashboard' : 'Create Account'}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {(mode === 'login' || mode === 'register') && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-[#4A2C21] px-4 text-white/20">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={emailLoading || googleLoading}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center transition-all border border-white/5 h-[54px]"
              >
                {googleLoading ? (
                  <Loader2 className="animate-spin mr-3 w-5 h-5" />
                ) : (
                  <span className="w-5 h-5 mr-3 rounded-full bg-white text-[#4285F4] flex items-center justify-center text-[11px] font-black leading-none">
                    G
                  </span>
                )}
                Google Account
              </button>
            </>
          )}

          <div className="mt-8 text-center space-y-4">
            {mode === 'forgot' || mode === 'reset-password' ? (
              <button
                type="button"
                onClick={goBack}
                className="text-white/40 hover:text-brand-orange text-xs font-bold uppercase tracking-widest transition-all block w-full"
              >
                Back to Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStatus(null);
                  setMode(mode === 'login' ? 'register' : 'login');
                }}
                className="text-white/40 hover:text-brand-orange text-xs font-bold uppercase tracking-widest transition-all block w-full"
              >
                {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
              </button>
            )}

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all block w-full py-2 border border-white/5 rounded-xl hover:bg-white/5"
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
