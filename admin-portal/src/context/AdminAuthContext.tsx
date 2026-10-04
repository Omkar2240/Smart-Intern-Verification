"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminUser } from "@/types/admin";
import { api } from "@/lib/api";

interface AdminAuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  collegeId: string | null;
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
        if (pathname !== "/login") router.push("/login");
        return;
      }

      // Handle demo tokens (frontend-only, no backend)
      if (storedToken.startsWith("demo-token-")) {
        const roleKey = storedToken.replace("demo-token-", "");
        const demoUsers: Record<string, AdminUser> = {
          super_admin: {
            id: "demo-super-1",
            name: "N. Super Administrator",
            email: "superadmin@trackintern.edu",
            role: "super_admin",
            college_id: null,
            college_name: null,
            department_id: null,
            department_name: null,
            is_active: true,
          },
          college_admin: {
            id: "demo-col-1",
            name: "GHRCE Admin",
            email: "ghrce.admin@trackintern.edu",
            role: "college_admin",
            college_id: "college-001",
            college_name: "G. H. Raisoni College of Engineering",
            department_id: null,
            department_name: null,
            is_active: true,
          },
          department_admin: {
            id: "demo-dept-1",
            name: "CSE Dept Admin",
            email: "cse.admin@trackintern.edu",
            role: "department_admin",
            college_id: "college-001",
            college_name: "G. H. Raisoni College of Engineering",
            department_id: "dept-001",
            department_name: "Computer Science & Engineering",
            is_active: true,
          },
        };
        const demoUser = demoUsers[roleKey];
        if (demoUser) {
          setToken(storedToken);
          setUser(demoUser);
          setIsLoading(false);
          return;
        }
      }

      // Real API auth
      try {
        setToken(storedToken);
        const currentUser = await api.getCurrentUser();

        let role = currentUser?.role;
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
      } catch {
        api.setToken(null);
        setUser(null);
        setToken(null);
        if (pathname !== "/login") router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  if (!context) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return context;
}
