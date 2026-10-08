/**
 * Client-side API client (uses localStorage for token)
 * All methods are strongly-typed against the backend API spec.
 */

import type {
  AdminUser,
  LoginResponse,
  AnalyticsSummary,
  VerificationListResponse,
  VerificationFilterParams,
  ActionResponse,
  RosterUploadResponse,
  AdminInternshipListResponse,
  InternshipFilterParams,
  UpdateInternshipStatusPayload,
  College,
  CollegeListResponse,
  CollegeAdminFilterParams,
  CreateCollegePayload,
  UpdateCollegePayload,
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  AdminUserListResponse,
  AdminUserFilterParams,
  CreateAdminUserPayload,
  StudentListResponse,
  Student,
  StudentFilterParams,
  AttendanceListResponse,
  AttendanceAnalytics,
  AttendanceFilterParams,
  AuditLogListResponse,
  AuditLogFilterParams,
  SystemConfig,
  CreateStudentPayload,
  UpdateStudentPayload,
  AdminPermissionOption,
  PlatformTrendResponse,
} from "@/types/admin";

// ─── Constants ────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://trackintern-backend.onrender.com/api/v1";

const TOKEN_KEY = "trackintern_admin_token";

// ─── Utility: Build query string ──────────────────────────────────────────────

export function extractErrorMessage(errorData: unknown, fallback: string): string {
  if (!errorData) return fallback;
  if (typeof errorData === "string") return errorData;
  if (typeof errorData !== "object") return fallback;

  const data = errorData as { detail?: unknown; message?: unknown; error?: unknown };
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  return fallback;
}

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}


// ─── ApiClient ────────────────────────────────────────────────────────────────

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  // ── Token management ──────────────────────────────────────────────────────

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      // Also set cookie for SSR reads
      document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Strict`;
    } else {
      localStorage.removeItem(TOKEN_KEY);
      document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  // ── Core request method ───────────────────────────────────────────────────

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login?expired=1";
      }
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = extractErrorMessage(errorData, errorMessage);
      } catch {
        // ignore parse error
      }
      throw new Error(errorMessage);
    }

    // Some endpoints return empty 204
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  /** Fetch binary (blob) endpoint and return an object URL */
  async fetchBlob(endpoint: string): Promise<string> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      let detail = `Server responded with ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.detail) detail = errJson.detail;
      } catch {}
      throw new Error(detail);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async logout(): Promise<ActionResponse> {
    const res = await this.request<ActionResponse>("/auth/logout", {
      method: "POST",
    });
    this.setToken(null);
    return res;
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return this.request<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // USER PROFILE
  // ─────────────────────────────────────────────────────────────────────────

  async getCurrentUser(): Promise<AdminUser> {
    return this.request<AdminUser>("/users/me");
  }

  async updateProfile(data: { name?: string; email?: string }): Promise<AdminUser> {
    return this.request<AdminUser>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ActionResponse> {
    return this.request<ActionResponse>("/users/me/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>("/admin/analytics/summary");
  }

  async getPlatformTrends(period: "today" | "monthly" | "yearly" | "all" = "monthly"): Promise<PlatformTrendResponse> {
    return this.request<PlatformTrendResponse>(
      `/admin/analytics/trends${buildQuery({ period })}`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VERIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────

  async getVerifications(params: VerificationFilterParams = {}): Promise<VerificationListResponse> {
    const qs = buildQuery(params);
    return this.request<VerificationListResponse>(`/admin/verifications${qs}`);
  }

  async getCardImageBlob(userId: string): Promise<string> {
    return this.fetchBlob(`/admin/verifications/${userId}/card-image`);
  }

  async approveVerification(userId: string): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/admin/verifications/${userId}/approve`, {
      method: "POST",
    });
  }

  async rejectVerification(userId: string, reason: string): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/admin/verifications/${userId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async resetBiometrics(userId: string): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/admin/verifications/${userId}/reset-biometrics`, {
      method: "POST",
    });
  }

  async forceVerifyStudent(userId: string): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/admin/verifications/${userId}/force-verify`, {
      method: "POST",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERNSHIPS
  // ─────────────────────────────────────────────────────────────────────────

  async getAdminInternships(params: InternshipFilterParams = {}): Promise<AdminInternshipListResponse> {
    const qs = buildQuery(params);
    return this.request<AdminInternshipListResponse>(`/admin/internships${qs}`);
  }

  async updateInternshipStatus(
    internshipId: string,
    data: UpdateInternshipStatusPayload
  ): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/admin/internships/${internshipId}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async getInternshipProofBlob(internshipId: string): Promise<string> {
    return this.fetchBlob(`/admin/internships/${internshipId}/proof`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COLLEGES
  // ─────────────────────────────────────────────────────────────────────────

  /** Public list (used in dropdowns, no pagination) */
  async getColleges(search?: string): Promise<College[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return this.request<College[]>(`/colleges${qs}`);
  }

  /** Admin paginated list (super_admin only) */
  async getAdminColleges(params: CollegeAdminFilterParams = {}): Promise<CollegeListResponse> {
    const qs = buildQuery(params);
    return this.request<CollegeListResponse>(`/admin/colleges${qs}`);
  }

  async createCollege(data: CreateCollegePayload): Promise<College> {
    return this.request<College>("/admin/colleges", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCollege(id: string, data: UpdateCollegePayload): Promise<College> {
    return this.request<College>(`/admin/colleges/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async uploadRoster(collegeId: string, file: File): Promise<RosterUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<RosterUploadResponse>(
      `/admin/colleges/${collegeId}/roster/upload`,
      { method: "POST", body: formData }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DEPARTMENTS
  // ─────────────────────────────────────────────────────────────────────────

  /** Public/shared list (used for dropdowns) */
  async getDepartments(search?: string): Promise<Department[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return this.request<Department[]>(`/departments${qs}`);
  }

  /** Admin list (super_admin: all; college_admin: own college) */
  async getAdminDepartments(params: { college_id?: string; search?: string } = {}): Promise<Department[]> {
    const qs = buildQuery(params);
    const response = await this.request<Department[] | { items: Department[] }>(`/admin/departments${qs}`);
    return Array.isArray(response) ? response : response.items;
  }

  async createDepartment(data: CreateDepartmentPayload): Promise<Department> {
    return this.request<Department>("/admin/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: string, data: UpdateDepartmentPayload): Promise<Department> {
    return this.request<Department>(`/admin/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN USERS
  // ─────────────────────────────────────────────────────────────────────────

  async getAdminUsers(params: AdminUserFilterParams = {}): Promise<AdminUserListResponse> {
    const qs = buildQuery(params);
    return this.request<AdminUserListResponse>(`/admin/admins${qs}`);
  }

  async createAdminUser(data: CreateAdminUserPayload): Promise<AdminUser> {
    return this.request<AdminUser>("/admin/admins", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAdminPermissions(): Promise<AdminPermissionOption[]> {
    return this.request<AdminPermissionOption[]>("/admin/permissions");
  }

  async toggleAdminStatus(adminId: string, isActive: boolean): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/admin/admins/${adminId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STUDENTS
  // ─────────────────────────────────────────────────────────────────────────

  async getStudents(params: StudentFilterParams = {}): Promise<StudentListResponse> {
    const qs = buildQuery(params);
    return this.request<StudentListResponse>(`/admin/students${qs}`);
  }

  async createStudent(data: CreateStudentPayload): Promise<Student> {
    return this.request<Student>("/admin/students", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateStudent(id: string, data: UpdateStudentPayload): Promise<Student> {
    return this.request<Student>(`/admin/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ATTENDANCE
  // ─────────────────────────────────────────────────────────────────────────

  async getAttendance(params: AttendanceFilterParams = {}): Promise<AttendanceListResponse> {
    const qs = buildQuery(params);
    return this.request<AttendanceListResponse>(`/admin/attendance${qs}`);
  }

  async getAttendanceAnalytics(
    params: { department_id?: string; period?: "week" | "month" | "quarter" | "year" } = {}
  ): Promise<AttendanceAnalytics> {
    const qs = buildQuery(params);
    return this.request<AttendanceAnalytics>(`/admin/attendance/analytics${qs}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUDIT LOGS (super_admin / admin only)
  // ─────────────────────────────────────────────────────────────────────────

  async getAuditLogs(params: AuditLogFilterParams = {}): Promise<AuditLogListResponse> {
    const qs = buildQuery(params);
    return this.request<AuditLogListResponse>(`/admin/audit-logs${qs}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SYSTEM CONFIG (super_admin / admin only)
  // ─────────────────────────────────────────────────────────────────────────

  async getSystemConfig(): Promise<SystemConfig> {
    return this.request<SystemConfig>("/admin/system-config");
  }

  async updateSystemConfig(data: Partial<SystemConfig>): Promise<SystemConfig> {
    return this.request<SystemConfig>("/admin/system-config", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const api = new ApiClient();
