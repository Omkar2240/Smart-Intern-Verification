"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminUser } from "@/types/admin";
import { api } from "@/lib/api";

interface AdminAuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  /** Shortcut: current user's college_id (null for super_admin) */
  collegeId: string | null;
  /** Shortcut: current user's department_id (null unless department_admin) */
  departmentId: string | null;
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

        let role = currentUser?.role;
        // If role is omitted in API response, probe admin privileges
        if (!role) {
          try {
            await api.getAnalyticsSummary();
            role = "college_admin";
            currentUser.role = role;
          } catch {
            api.setToken(null);
            setUser(null);
            setToken(null);
            router.push("/login?error=unauthorized");
            return;
          }
        } else if (
          role !== "college_admin" &&
          role !== "super_admin" &&
          role !== "department_admin" &&
          (role as string) !== "admin"
        ) {
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

  // Derived scope fields for convenience
  const collegeId = user?.college_id ?? null;
  const departmentId = user?.department_id ?? null;

  return (
    <AdminAuthContext.Provider value={{ user, token, isLoading, collegeId, departmentId, login, logout }}>
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
