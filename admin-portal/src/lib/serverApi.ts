/**
 * Server-side API client for Next.js App Router Server Components.
 * Reads the auth token from cookies (set by the client-side api.setToken).
 * Never uses localStorage (not available on server).
 */

import { cookies } from "next/headers";
import type {
  AdminUser,
  AnalyticsSummary,
  VerificationListResponse,
  VerificationFilterParams,
  AdminInternshipListResponse,
  InternshipFilterParams,
  College,
  CollegeListResponse,
  CollegeAdminFilterParams,
  Department,
  AdminUserListResponse,
  AdminUserFilterParams,
  StudentListResponse,
  StudentFilterParams,
  AttendanceListResponse,
  AttendanceAnalytics,
  AttendanceFilterParams,
  AuditLogListResponse,
  AuditLogFilterParams,
  SystemConfig,
} from "@/types/admin";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://trackintern-backend.onrender.com/api/v1";

const TOKEN_COOKIE = "trackintern_admin_token";

// ─── Utility ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQuery(params: any): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "" || value === "all")
      continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value ?? null;
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

async function serverFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  revalidate: number | false = 30
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    next: { revalidate },
  });

  if (!response.ok) {
    // Return null-ish result instead of throwing to keep SSR graceful
    console.error(`[serverApi] ${response.status} ${endpoint}`);
    throw new Error(`API error ${response.status} for ${endpoint}`);
  }

  return response.json() as Promise<T>;
}

// ─── Server API Functions ─────────────────────────────────────────────────────

export const serverApi = {
  // ── Auth / Profile ─────────────────────────────────────────────────────

  async getCurrentUser(): Promise<AdminUser | null> {
    try {
      return await serverFetch<AdminUser>("/users/me", {}, false); // no cache for user
    } catch {
      return null;
    }
  },

  // ── Analytics ──────────────────────────────────────────────────────────

  async getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
    try {
      return await serverFetch<AnalyticsSummary>("/admin/analytics/summary", {}, 60);
    } catch {
      return null;
    }
  },

  // ── Verifications ──────────────────────────────────────────────────────

  async getVerifications(
    params: VerificationFilterParams = {}
  ): Promise<VerificationListResponse | null> {
    try {
      const qs = buildQuery(params);
      return await serverFetch<VerificationListResponse>(`/admin/verifications${qs}`, {}, 30);
    } catch {
      return null;
    }
  },

  // ── Internships ────────────────────────────────────────────────────────

  async getAdminInternships(
    params: InternshipFilterParams = {}
  ): Promise<AdminInternshipListResponse | null> {
    try {
      const qs = buildQuery(params);
      return await serverFetch<AdminInternshipListResponse>(`/admin/internships${qs}`, {}, 30);
    } catch {
      return null;
    }
  },

  // ── Colleges ───────────────────────────────────────────────────────────

  async getColleges(search?: string): Promise<College[]> {
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : "";
      return await serverFetch<College[]>(`/colleges${qs}`, {}, 120);
    } catch {
      return [];
    }
  },

  async getAdminColleges(
    params: CollegeAdminFilterParams = {}
  ): Promise<CollegeListResponse | null> {
    try {
      const qs = buildQuery(params);
      return await serverFetch<CollegeListResponse>(`/admin/colleges${qs}`, {}, 60);
    } catch {
      return null;
    }
  },

  // ── Departments ────────────────────────────────────────────────────────

  async getDepartments(params: { college_id?: string; search?: string; page?: number; page_size?: number } = {}): Promise<Department[]> {
    try {
      const qs = buildQuery({ ...params, page: 1, page_size: 100 }); // Fetch all departments
      const response = await serverFetch<{ items: Department[] } | Department[]>(`/admin/departments${qs}`, {}, 60);
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response)) {
        return response;
      }
      return response?.items ?? [];
    } catch {
      return [];
    }
  },

  // ── Admin Users ────────────────────────────────────────────────────────

  async getAdminUsers(
    params: AdminUserFilterParams = {}
  ): Promise<AdminUserListResponse | null> {
    try {
      const qs = buildQuery(params);
      return await serverFetch<AdminUserListResponse>(`/admin/admins${qs}`, {}, 30);
    } catch {
      return null;
    }
  },

  // ── Students ───────────────────────────────────────────────────────────

  async getStudents(
    params: StudentFilterParams = {}
  ): Promise<StudentListResponse | null> {
    try {
      const qs = buildQuery(params);
      return await serverFetch<StudentListResponse>(`/admin/students${qs}`, {}, 30);
    } catch {
      return null;
    }
  },

  // ── Attendance ─────────────────────────────────────────────────────────

  async getAttendance(
    params: AttendanceFilterParams = {}
  ): Promise<AttendanceListResponse | null> {
    try {
      const qs = buildQuery(params);
      return await serverFetch<AttendanceListResponse>(`/admin/attendance${qs}`, {}, 30);
    } catch {
      return null;
    }
  },

  async getAttendanceAnalytics(
    params: { department_id?: string; period?: string } = {}
  ): Promise<AttendanceAnalytics | null> {
    try {
      const qs = buildQuery(params);
      return await serverFetch<AttendanceAnalytics>(`/admin/attendance/analytics${qs}`, {}, 60);
    } catch {
      return null;
    }
  },

  // ── Audit Logs ─────────────────────────────────────────────────────────

  async getAuditLogs(
    params: AuditLogFilterParams = {}
  ): Promise<AuditLogListResponse | null> {
    try {
      const qs = buildQuery(params);
      return await serverFetch<AuditLogListResponse>(`/admin/audit-logs${qs}`, {}, 0);
    } catch {
      return null;
    }
  },

  // ── System Config ──────────────────────────────────────────────────────

  async getSystemConfig(): Promise<SystemConfig | null> {
    try {
      return await serverFetch<SystemConfig>("/admin/system-config", {}, 60);
    } catch {
      return null;
    }
  },
};
