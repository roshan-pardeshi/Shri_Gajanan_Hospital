import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: Role;
  isLoading: boolean;
  login: (email: string, role?: Role, name?: string) => Promise<void>;
  register: (profile: Omit<UserProfile, 'id' | 'role'>) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchRole: (role: Role) => void;
}

const DEFAULT_PATIENT: UserProfile = {
  id: 'user-patient-1',
  email: 'suresh.patil@example.com',
  full_name: 'Suresh Patil',
  mobile_number: '+91 98201 54321',
  date_of_birth: '1984-06-15',
  gender: 'Male',
  address: 'B-402, Gokul Heights, Borivali West, Mumbai, Maharashtra 400092',
  role: 'patient',
  created_at: '2026-01-10T10:00:00Z',
};

const DEFAULT_ADMIN: UserProfile = {
  id: 'user-admin-1',
  email: 'admin@smartcarehospital.org',
  full_name: 'Dr. Ramesh Shinde (Medical Superintendent)',
  mobile_number: '+91 98200 11223',
  role: 'admin',
  created_at: '2025-01-01T08:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('sgh_current_user');
      return stored ? JSON.parse(stored) : DEFAULT_PATIENT;
    } catch {
      return DEFAULT_PATIENT;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // If Supabase is configured, check active session
    const client = supabase;
    if (isSupabaseConfigured() && client) {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          // fetch profile
          client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setUser(data as UserProfile);
                localStorage.setItem('sgh_current_user', JSON.stringify(data));
              }
            });
        }
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setUser(data as UserProfile);
                localStorage.setItem('sgh_current_user', JSON.stringify(data));
              }
            });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, selectedRole: Role = 'patient', name?: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        // Real Supabase sign in could be called here
      }

      const newUser: UserProfile = selectedRole === 'admin'
        ? DEFAULT_ADMIN
        : {
            id: `user-${Date.now()}`,
            email,
            full_name: name || (email.split('@')[0].replace('.', ' ').toUpperCase()),
            mobile_number: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
            role: selectedRole,
            created_at: new Date().toISOString(),
          };

      setUser(newUser);
      localStorage.setItem('sgh_current_user', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (profileData: Omit<UserProfile, 'id' | 'role'>) => {
    setIsLoading(true);
    try {
      const newUser: UserProfile = {
        ...profileData,
        id: `user-${Date.now()}`,
        role: 'patient',
        created_at: new Date().toISOString(),
      };

      setUser(newUser);
      localStorage.setItem('sgh_current_user', JSON.stringify(newUser));

      if (isSupabaseConfigured() && supabase) {
        await supabase.from('profiles').insert([newUser]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('sgh_current_user');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('sgh_current_user', JSON.stringify(updated));

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
    }
  };

  const switchRole = (newRole: Role) => {
    if (newRole === 'admin') {
      setUser(DEFAULT_ADMIN);
      localStorage.setItem('sgh_current_user', JSON.stringify(DEFAULT_ADMIN));
    } else {
      setUser(DEFAULT_PATIENT);
      localStorage.setItem('sgh_current_user', JSON.stringify(DEFAULT_PATIENT));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'patient',
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        switchRole,
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
