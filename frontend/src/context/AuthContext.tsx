'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/types/logistics';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  fullName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, role?: UserRole) => void;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default guest / active user
const defaultUser: AuthUser = {
  id: 'usr-001',
  username: '0000',
  role: 'ADMIN',
  fullName: 'Lead Dispatch Ops (0000)',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sloth_auth_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        setUser(defaultUser);
      }
    } else {
      // Default to logged-in ADMIN for immediate usability, or allow login
      setUser(defaultUser);
    }
    setMounted(true);
  }, []);

  const login = (username: string, role: UserRole = 'ADMIN') => {
    const u: AuthUser = {
      id: `usr-${Date.now()}`,
      username,
      role,
      fullName: username === '0000' ? 'System Superadmin (0000)' : `${username} (${role})`,
    };
    setUser(u);
    localStorage.setItem('sloth_auth_user', JSON.stringify(u));
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem('sloth_auth_user', JSON.stringify(updated));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sloth_auth_user');
  };

  const hasRole = (allowed: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'Superadmin') return true;
    return allowed.includes(user.role);
  };

  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
