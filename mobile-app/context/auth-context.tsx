import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, ApiUser, LoginPayload, RegisterPayload, VerificationStatus } from '@/services/api';
import { storage } from '@/services/storage';

interface AuthContextType {
  user: ApiUser | null;
  verificationStatus: VerificationStatus | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  refreshVerificationStatus: () => Promise<VerificationStatus | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVerification = async (): Promise<VerificationStatus | null> => {
    try {
      const status = await api.getVerificationStatus();
      setVerificationStatus(status);
      return status;
    } catch (e) {
      console.warn('Failed to fetch verification status:', e);
      return null;
    }
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const token = await storage.getAccessToken();

      if (!token) {
        setUser(null);
        setVerificationStatus(null);
        return false;
      }

      try {
        const status = await api.getAuthStatus();
        if (status.authenticated && status.user) {
          try {
            const me = await api.getMe();
            setUser(me);
            const refreshToken = await storage.getRefreshToken();
            if (token && refreshToken) {
              await storage.saveAuthData(token, refreshToken, me);
            }
          } catch {
            setUser(status.user);
          }

          // Fetch verification status
          await fetchVerification();
          return true;
        } else {
          await storage.clearAuthData();
          setUser(null);
          setVerificationStatus(null);
          return false;
        }
      } catch (backendError) {
        console.warn('Backend verification failed, using stored user:', backendError);
        const storedUser = await storage.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          await fetchVerification();
          return true;
        }
        setUser(null);
        setVerificationStatus(null);
        return false;
      }
    } catch (e) {
      console.warn('Auth check error:', e);
      setUser(null);
      setVerificationStatus(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await api.login(data);
      try {
        const me = await api.getMe();
        setUser(me);
        await storage.saveAuthData(response.access_token, response.refresh_token, me);
      } catch {
        setUser(response.user);
      }
      await fetchVerification();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await api.register(data);
      try {
        const me = await api.getMe();
        setUser(me);
        await storage.saveAuthData(response.access_token, response.refresh_token, me);
      } catch {
        setUser(response.user);
      }
      await fetchVerification();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
      setVerificationStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      const token = await storage.getAccessToken();
      const refreshToken = await storage.getRefreshToken();
      if (token && refreshToken) {
        await storage.saveAuthData(token, refreshToken, me);
      }
    } catch (e) {
      console.warn('Failed to refresh user:', e);
    }
  };

  const refreshVerificationStatus = async (): Promise<VerificationStatus | null> => {
    return await fetchVerification();
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        verificationStatus,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuthStatus,
        refreshUser,
        refreshVerificationStatus,
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
