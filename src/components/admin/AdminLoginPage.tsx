import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Building2,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/validation';

interface AdminLoginPageProps {
  onNavigateHome: () => void;
  onNavigateDashboard?: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onNavigateHome,
  onNavigateDashboard,
  onLoginSuccess,
}) => {
  const { adminLogin, requestPasswordReset, user, isAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorizedRole, setIsUnauthorizedRole] = useState(false);

  // Forgot password flow
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<string | null>(null);

  // If already logged in and verified as administrator, prompt to continue
  if (user && isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
              Verified Session Active
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Administrator Authorized
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              You are signed in as <strong className="text-slate-800">{user.email}</strong> with verified administrator privileges.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={onLoginSuccess}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Enter Operations Dashboard</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Back to Hospital Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsUnauthorizedRole(false);

    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      setErrorMessage(emailCheck.error || 'Please enter a valid official administrator email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please provide your administrator password.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin(emailCheck.value!, password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(res.error || 'Unable to sign in. Please check your credentials or try again.');
        if (res.isUnauthorizedRole) {
          setIsUnauthorizedRole(true);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to sign in. Please check your credentials or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFeedback(null);

    const emailCheck = validateEmail(forgotEmail, true);
    if (!emailCheck.isValid) {
      setForgotFeedback(emailCheck.error || 'Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await requestPasswordReset(emailCheck.value!);
      setForgotFeedback(res.message);
    } catch (err) {
      setForgotFeedback('If an authorized account is registered with this email, password recovery instructions have been sent.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Navigation Link */}
      <div className="max-w-md w-full mx-auto mb-6">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hospital Website</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle teal accent line at top of card */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-900 via-teal-600 to-teal-400" />

          {/* Hospital Brand & Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-teal-400 mx-auto flex items-center justify-center shadow-lg shadow-slate-900/10 mb-4 border border-slate-700/50">
              <Building2 className="w-8 h-8 text-teal-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Smart Care Gajanan Hospital</span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Administrator Login
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Secure access for authorized hospital staff.
            </p>
          </div>

          {/* Mode 1: Forgot Password Form */}
          {isForgotMode ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-100 text-xs text-teal-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-teal-600" />
                  Account Recovery
                </span>
                <p className="text-[11px] text-teal-800">
                  Enter your official hospital email address to receive password recovery instructions.
                </p>
              </div>

              {forgotFeedback && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{forgotFeedback}</span>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="admin@smartcarehospital.org"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-hidden transition-all bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="pt-1 space-y-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Recovery Link...</span>
                      </>
                    ) : (
                      <span>Send Recovery Instructions</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setForgotFeedback(null);
                    }}
                    className="w-full py-2.5 text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Back to Administrator Login
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Mode 2: Standard Administrator Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Notification Banner */}
              {errorMessage && (
                <div 
                  role="alert"
                  className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in duration-200 ${
                    isUnauthorizedRole 
                      ? 'bg-rose-50 border-rose-200 text-rose-800' 
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isUnauthorizedRole ? 'text-rose-600' : 'text-amber-600'}`} />
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold leading-relaxed">
                      {errorMessage}
                    </p>
                    {isUnauthorizedRole && (
                      <div className="pt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={onNavigateHome}
                          className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition-colors"
                        >
                          Return to Homepage
                        </button>
                        {onNavigateDashboard && (
                          <button
                            type="button"
                            onClick={onNavigateDashboard}
                            className="px-3 py-1 rounded-lg border border-rose-300 bg-white text-rose-700 font-bold text-[11px] hover:bg-rose-50 transition-colors"
                          >
                            Go to Patient Dashboard
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="admin-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Official Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="admin@smartcarehospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-hidden transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="admin-password" className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-hidden transition-all bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                      <span>Verifying Credentials & Roles...</span>
                    </>
                  ) : (
                    <span>Sign In to Admin Panel</span>
                  )}
                </button>
              </div>

              {/* Quick Fill / Local Dev Credentials Hint */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5 text-teal-700">
                    <KeyRound className="w-3.5 h-3.5" />
                    Default Admin Credentials
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@smartcarehospital.org');
                      setPassword('admin123');
                      setErrorMessage(null);
                    }}
                    className="text-teal-600 hover:text-teal-800 underline font-semibold cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
                <p>Email: <span className="font-mono text-slate-900 font-semibold">admin@smartcarehospital.org</span></p>
                <p>Password: <span className="font-mono text-slate-900 font-semibold">admin123</span></p>
              </div>
            </form>
          )}

          {/* Security Assurance Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>TLS Encrypted</span>
            </span>
            <span>•</span>
            <span>Local MySQL 8.0</span>
            <span>•</span>
            <span>Authorized Staff Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};
