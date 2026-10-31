import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Role, UserProfile } from '../types';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/apiClient';
import { dataService } from '../services/dataService';

export interface AdminAuthResult {
  success: boolean;
  error?: string;
  isUnauthorizedRole?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  role: Role;
  isAdmin: boolean;
  isLoading: boolean;
  adminVerificationState: 'idle' | 'checking' | 'authorized' | 'denied';
  login: (email: string, password?: string, name?: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<AdminAuthResult>;
  register: (profile: Omit<UserProfile, 'id' | 'role'>, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  verifyCurrentAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('sgh_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.email) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('sgh_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.role === 'admin' && Boolean(parsed?.is_admin_verified);
      }
      return false;
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminVerificationState, setAdminVerificationState] = useState<'idle' | 'checking' | 'authorized' | 'denied'>('idle');

  // Server/Database-level admin verification
  const verifyCurrentAdminStatus = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setIsAdmin(false);
      setAdminVerificationState('idle');
      return false;
    }

    setAdminVerificationState('checking');
    try {
      const { isAdmin: verifiedAdmin } = await dataService.verifyAdminRole(user.id);
      if (verifiedAdmin) {
        setIsAdmin(true);
        setAdminVerificationState('authorized');
        return true;
      } else {
        setIsAdmin(false);
        setAdminVerificationState('denied');
        return false;
      }
    } catch (err) {
      console.error('Failed to verify admin status:', err);
      setIsAdmin(false);
      setAdminVerificationState('denied');
      return false;
    }
  }, [user]);

  // Initial session & role verification with backend MySQL
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      setIsLoading(true);
      const token = getAuthToken();

      if (!token) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await api.get<{ user: UserProfile; isAdmin: boolean }>('/auth/me');
        if (mounted && res && res.user) {
          const resolvedUser = {
            ...res.user,
            is_admin_verified: res.isAdmin,
          };
          setUser(resolvedUser);
          setIsAdmin(res.isAdmin);
          setAdminVerificationState(res.isAdmin ? 'authorized' : 'idle');
          localStorage.setItem('sgh_current_user', JSON.stringify(resolvedUser));
        }
      } catch (err) {
        console.warn('Session verification notice (clearing stale token):', err);
        clearAuthToken();
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setAdminVerificationState('idle');
          localStorage.removeItem('sgh_current_user');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Standard patient login
  const login = async (email: string, password?: string, name?: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<{ token: string; user: UserProfile; isAdmin: boolean }>('/auth/login', {
        email: email.trim(),
        password,
        name,
      });

      if (res?.token) {
        setAuthToken(res.token);
      }

      const profileToSet: UserProfile = {
        ...res.user,
        is_admin_verified: res.isAdmin,
      };

      setUser(profileToSet);
      setIsAdmin(res.isAdmin || false);
      setAdminVerificationState(res.isAdmin ? 'authorized' : 'idle');
      localStorage.setItem('sgh_current_user', JSON.stringify(profileToSet));
    } catch (err: any) {
      throw new Error(err.message || 'Unable to sign in. Please check your credentials or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Dedicated Secure Administrator Login
  const adminLogin = async (email: string, password: string): Promise<AdminAuthResult> => {
    setIsLoading(true);
    setAdminVerificationState('checking');

    try {
      const res = await api.post<{ success: boolean; token: string; user: UserProfile; isAdmin: boolean }>(
        '/auth/admin-login',
        {
          email: email.trim(),
          password,
        }
      );

      if (res?.token) {
        setAuthToken(res.token);
      }

      const adminProfile: UserProfile = {
        ...res.user,
        role: 'admin',
        is_admin_verified: true,
      };

      setUser(adminProfile);
      setIsAdmin(true);
      setAdminVerificationState('authorized');
      localStorage.setItem('sgh_current_user', JSON.stringify(adminProfile));

      return { success: true };
    } catch (err: any) {
      setAdminVerificationState('denied');
      clearAuthToken();
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('sgh_current_user');

      return {
        success: false,
        error: err.message || 'Unable to sign in. Please check your credentials or try again.',
        isUnauthorizedRole: Boolean(err.data?.isUnauthorizedRole),
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Secure Password Recovery Request
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        return { success: false, message: 'Please provide a valid email address.' };
      }

      const res = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', {
        email: cleanEmail,
      });

      return {
        success: true,
        message: res.message || 'If an authorized account is registered with this email, password recovery instructions have been sent.',
      };
    } catch (err: any) {
      return {
        success: true,
        message: 'If an authorized account is registered with this email, password recovery instructions have been sent.',
      };
    }
  };

  const register = async (profileData: Omit<UserProfile, 'id' | 'role'>, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<{ token: string; user: UserProfile }>('/auth/register', {
        ...profileData,
        password,
      });

      if (res?.token) {
        setAuthToken(res.token);
      }

      const newProfile: UserProfile = {
        ...res.user,
        role: 'patient',
      };

      setUser(newProfile);
      setIsAdmin(false);
      localStorage.setItem('sgh_current_user', JSON.stringify(newProfile));
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      clearAuthToken();
    } finally {
      setUser(null);
      setIsAdmin(false);
      setAdminVerificationState('idle');
      localStorage.removeItem('sgh_current_user');
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    // Prevent client-side self-promotion
    const safeUpdates = { ...updates };
    delete (safeUpdates as any).role;

    try {
      const updated = await api.put<UserProfile>('/auth/profile', safeUpdates);
      const merged = { ...user, ...updated };
      setUser(merged);
      localStorage.setItem('sgh_current_user', JSON.stringify(merged));
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'patient',
        isAdmin,
        isLoading,
        adminVerificationState,
        login,
        adminLogin,
        register,
        logout,
        requestPasswordReset,
        updateProfile,
        verifyCurrentAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
