"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminUser } from "@/types/admin";
import { api } from "@/lib/api";

interface AdminAuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      const storedToken = api.getToken();
      if (!storedToken) {
        setIsLoading(false);
        if (pathname !== "/login") {
          router.push("/login");
        }
        return;
      }

      try {
        setToken(storedToken);
        const currentUser = await api.getCurrentUser();
        if (currentUser.role !== "college_admin" && currentUser.role !== "super_admin") {
          api.setToken(null);
          setUser(null);
          setToken(null);
          router.push("/login?error=unauthorized");
          return;
        }
        setUser(currentUser);
      } catch (err) {
        console.error("Failed to restore admin auth session:", err);
        api.setToken(null);
        setUser(null);
        setToken(null);
        if (pathname !== "/login") {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  const login = (newToken: string, newUser: AdminUser) => {
    api.setToken(newToken);
    setToken(newToken);
    setUser(newUser);
    router.push("/");
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AdminAuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
