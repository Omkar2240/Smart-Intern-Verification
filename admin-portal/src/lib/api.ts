import {
  AdminUser,
  AnalyticsSummary,
  College,
  VerificationItem,
  VerificationListResponse,
  ActionResponse,
  RosterUploadResponse,
  AdminInternshipItem,
  AdminInternshipListResponse,
} from "@/types/admin";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://trackintern-backend.onrender.com/api/v1";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("trackintern_admin_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("trackintern_admin_token", token);
      } else {
        localStorage.removeItem("trackintern_admin_token");
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("trackintern_admin_token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login?expired=1";
      }
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Fallback to text
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: AdminUser }> {
    const res = await this.request<{ access_token: string; user: AdminUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getCurrentUser(): Promise<AdminUser> {
    return this.request<AdminUser>("/users/me");
  }

  // Analytics
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>("/admin/analytics/summary");
  }

  // Verification Queue
  async getVerifications(params: {
    status?: string;
    search?: string;
    college_id?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<VerificationListResponse> {
    const query = new URLSearchParams();
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    if (params.college_id) query.set("college_id", params.college_id);
    if (params.page) query.set("page", params.page.toString());
    if (params.page_size) query.set("page_size", params.page_size.toString());

    const qs = query.toString();
    return this.request<VerificationListResponse>(`/admin/verifications${qs ? `?${qs}` : ""}`);
  }

  async getCardImageBlob(userId: string): Promise<string> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/admin/verifications/${userId}/card-image`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Unable to load card image");
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
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

  // Student Internships
  async getAdminInternships(params: {
    stage?: string;
    status?: string;
    search?: string;
    college_id?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<AdminInternshipListResponse> {
    const query = new URLSearchParams();
    if (params.stage && params.stage !== "all") query.set("stage", params.stage);
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    if (params.college_id) query.set("college_id", params.college_id);
    if (params.page) query.set("page", params.page.toString());
    if (params.page_size) query.set("page_size", params.page_size.toString());

    const qs = query.toString();
    return this.request<AdminInternshipListResponse>(`/admin/internships${qs ? `?${qs}` : ""}`);
  }

  async updateInternshipStatus(
    internshipId: string,
    data: {
      verification_stage: string;
      status?: string;
      rejection_reason?: string;
    }
  ): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/admin/internships/${internshipId}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async getInternshipProofBlob(internshipId: string): Promise<string> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/admin/internships/${internshipId}/proof`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Unable to load offer letter / proof document");
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // Colleges & Rosters
  async getColleges(search?: string): Promise<College[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return this.request<College[]>(`/colleges${qs}`);
  }

  async createCollege(data: {
    name: string;
    city: string;
    state: string;
    country: string;
    code?: string;
  }): Promise<College> {
    return this.request<College>("/admin/colleges", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCollege(
    id: string,
    data: Partial<{
      name: string;
      city: string;
      state: string;
      country: string;
      code?: string;
      is_active?: boolean;
    }>
  ): Promise<College> {
    return this.request<College>(`/admin/colleges/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async uploadRoster(collegeId: string, file: File): Promise<RosterUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<RosterUploadResponse>(`/admin/colleges/${collegeId}/roster/upload`, {
      method: "POST",
      body: formData,
    });
  }
}

export const api = new ApiClient();
