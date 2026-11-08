import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, AlertCircle, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateName, validateMobile, validateEmail, validatePassword } from '../../utils/validation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateAdminLogin?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onNavigateAdminLogin,
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Register Form
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say'>('Male');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      setErrors({ email: emailCheck.error || 'Please enter a valid email address.' });
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await login(emailCheck.value!, password);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to sign in. Please verify your credentials or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const newErrors: Record<string, string> = {};

    const nameCheck = validateName(fullName, 'Full name');
    if (!nameCheck.isValid) {
      newErrors.fullName = nameCheck.error || 'Please enter a valid full name.';
    }

    const mobileCheck = validateMobile(mobileNumber, true);
    if (!mobileCheck.isValid) {
      newErrors.mobileNumber = mobileCheck.error || 'Please enter a valid 10-digit mobile number.';
    }

    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      newErrors.email = emailCheck.error || 'Please enter a valid email address.';
    }

    const passCheck = validatePassword(registerPassword, 6);
    if (!passCheck.isValid) {
      newErrors.registerPassword = passCheck.error || 'Password must be at least 6 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await register({
        full_name: nameCheck.value!,
        mobile_number: mobileCheck.value!,
        email: emailCheck.value!,
        date_of_birth: dob,
        gender,
        address,
      }, passCheck.value!);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check the entered information.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Patient Demo for evaluators
  const handleDemoPatient = async () => {
    setErrorMsg(null);
    setErrors({});
    setLoading(true);
    try {
      await login('suresh.patil@example.com', undefined, 'Suresh Patil');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 xs:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-4 xs:p-6 sm:p-8 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="text-center mb-6">
          <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
            Patient Portal
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {mode === 'login' ? 'Sign In as Patient' : 'Patient Registration'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Access your appointment schedule, consult history, and slips.'
              : 'Register your patient profile to book and track OPD appointments.'}
          </p>

          <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Demo One-Click Access Helper for Patient */}
        <div className="mb-5 p-3 rounded-2xl bg-teal-50/60 border border-teal-100 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-800">
              Quick Patient Access:
            </span>
            <button
              type="button"
              onClick={handleDemoPatient}
              className="py-1 px-3 rounded-lg font-bold text-[11px] bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
            >
              Log in as Suresh Patil (Demo)
            </button>
          </div>
        </div>

        {/* Mode = Login */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:outline-hidden ${
                    errors.email
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400 text-rose-900'
                      : 'border-slate-200 focus:ring-teal-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 transition-all mt-2 disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In as Patient'}
            </button>
          </form>
        ) : (
          /* Mode = Register */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs max-h-96 overflow-y-auto pr-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Suresh Patil"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:outline-hidden ${
                  errors.fullName
                    ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400 text-rose-900'
                    : 'border-slate-200 focus:ring-teal-500'
                }`}
              />
              {errors.fullName && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value);
                  if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: '' }));
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:outline-hidden ${
                  errors.mobileNumber
                    ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400 text-rose-900'
                    : 'border-slate-200 focus:ring-teal-500'
                }`}
              />
              {errors.mobileNumber && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.mobileNumber}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="patient@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:outline-hidden ${
                  errors.email
                    ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400 text-rose-900'
                    : 'border-slate-200 focus:ring-teal-500'
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={registerPassword}
                onChange={(e) => {
                  setRegisterPassword(e.target.value);
                  if (errors.registerPassword) setErrors((prev) => ({ ...prev, registerPassword: '' }));
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:outline-hidden ${
                  errors.registerPassword
                    ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400 text-rose-900'
                    : 'border-slate-200 focus:ring-teal-500'
                }`}
              />
              {errors.registerPassword && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.registerPassword}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                placeholder="e.g. Borivali West, Mumbai"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 transition-all mt-2 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Create Patient Account'}
            </button>
          </form>
        )}

        {/* Admin Portal Gateway Link */}
        {onNavigateAdminLogin && (
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateAdminLogin();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors group"
            >
              <span>Authorized Hospital Staff or Administrator?</span>
              <span className="text-teal-600 group-hover:underline flex items-center gap-0.5">
                Admin Login
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
