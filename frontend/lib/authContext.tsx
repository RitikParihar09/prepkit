'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthToken, getAuthToken } from './api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {}
});

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('trao_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('trao_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('trao_user');
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const token = getAuthToken();
      if (token) {
        // Hydrate immediately from cache to avoid flicker / instant logout
        const cachedUser = getStoredUser();
        if (cachedUser) {
          setUser(cachedUser);
        }
        try {
          const res = await api.getMe();
          setUser(res.user);
          setStoredUser(res.user);
        } catch (err: any) {
          // Only log out if explicitly unauthorized (401 invalid token)
          // If network failed due to rapid page refreshes, retain cached session
          if (err?.message?.includes('Authentication token') || err?.message?.includes('expired') || err?.message?.includes('invalid')) {
            setAuthToken(null);
            setStoredUser(null);
            setUser(null);
          }
        }
      } else {
        setUser(null);
        setStoredUser(null);
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    setAuthToken(token);
    setStoredUser(userData);
    setUser(userData);
  };

  const logout = () => {
    setAuthToken(null);
    setStoredUser(null);
    setUser(null);
    api.logout().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
