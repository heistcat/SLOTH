'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = { username: string; role: string } | null;

interface AuthContextType {
  user: User;
  login: (username: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  // Quick persist in localStorage for the mock
  useEffect(() => {
    const saved = localStorage.getItem('mockUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = (username: string, role: string) => {
    const u = { username, role };
    setUser(u);
    localStorage.setItem('mockUser', JSON.stringify(u));
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
