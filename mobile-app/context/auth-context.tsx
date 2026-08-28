import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, ApiUser, LoginPayload, RegisterPayload } from '@/services/api';
import { storage } from '@/services/storage';

interface AuthContextType {
  user: ApiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const token = await storage.getAccessToken();

      if (!token) {
        // No stored token -> user is definitely not authenticated
        setUser(null);
        return false;
      }

      // Stored token exists -> verify with backend
      try {
        const status = await api.getAuthStatus();
        if (status.authenticated && status.user) {
          setUser(status.user);
          return true;
        } else {
          await storage.clearAuthData();
          setUser(null);
          return false;
        }
      } catch (backendError) {
        console.warn('Backend verification failed, using stored user:', backendError);
        const storedUser = await storage.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          return true;
        }
        setUser(null);
        return false;
      }
    } catch (e) {
      console.warn('Auth check error:', e);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await api.login(data);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await api.register(data);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch (e) {
      console.warn('Failed to refresh user:', e);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuthStatus,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
