import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';

// Smart API Base URL resolver:
// 1. Explicit EXPO_PUBLIC_API_URL (if provided)
// 2. Metro host LAN IP when running via Expo Go on physical devices over Wi-Fi
// 3. Android Emulator fallback (10.0.2.2 maps to host machine localhost:8000)
// 4. Web & iOS Simulator: localhost:8000
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    if (__DEV__) console.log('[API] Using EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // If running via Expo Go on a physical device over LAN, resolve host machine IP
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      if (__DEV__) console.log(`[API] Metro host IP detected -> using http://${hostIp}:8000`);
      return `http://${hostIp}:8000`;
    }
  }

  // Android emulator loopback alias to host machine
  if (Platform.OS === 'android') {
    if (__DEV__) console.log('[API] Android detected -> using http://10.0.2.2:8000');
    return 'http://10.0.2.2:8000';
  }

  if (__DEV__) console.log('[API] Web/iOS detected -> using http://localhost:8000');
  return 'http://localhost:8000';
};

export const API_BASE_URL = getBaseUrl();

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  registration_number?: string;
  mobile_number?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: ApiUser;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user: ApiUser | null;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  college: string;
  branch: string;
  roll_number: string;
  has_college_id: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  registration_number: string;
  mobile_number: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ProfilePayload {
  college: string;
  branch: string;
  roll_number: string;
}

export interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  code?: string;
  is_active: boolean;
}

export interface VerificationStatus {
  is_verified: boolean;
  current_step: 'college_selection' | 'college_id' | 'face' | 'completed';
  college_id: string | null;
  college_name: string | null;
  college_verified: boolean;
  college_id_verified: boolean;
  college_id_status: 'not_started' | 'pending' | 'verified' | 'rejected' | 'manual_review';
  face_verified: boolean;
  face_status: 'not_started' | 'pending' | 'verified' | 'rejected';
  overall_status: 'not_started' | 'pending' | 'verified' | 'rejected' | 'manual_review';
  rejection_reason: string | null;
}

export interface VerificationStepResult {
  success: boolean;
  message: string;
  step: string;
  step_status: string;
  overall_status: string;
  extracted_metadata?: Record<string, any>;
}

export interface Internship {
  id: string;
  user_id: string;
  company_name: string;
  role: string;
  department?: string | null;
  internship_type: 'on_site' | 'remote' | 'hybrid';
  location?: string | null;
  supervisor_name?: string | null;
  supervisor_email?: string | null;
  supervisor_phone?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  stipend?: string | null;
  offer_letter_url?: string | null;
  verification_stage: 'submitted' | 'tp_review' | 'mentor_review' | 'verified' | 'rejected';
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InternshipCreatePayload {
  company_name: string;
  role: string;
  department?: string;
  internship_type?: 'on_site' | 'remote' | 'hybrid';
  location?: string;
  supervisor_name?: string;
  supervisor_email?: string;
  supervisor_phone?: string;
  start_date?: string;
  end_date?: string;
  stipend?: string;
  offer_letter_url?: string;
}

class ApiService {
  private baseUrl = API_BASE_URL;
  private readonly defaultTimeoutMs = 6000; // 6s timeout to prevent hanging

  private async getHeaders(includeAuth = true, isJson = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (includeAuth) {
      const token = await storage.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = this.defaultTimeoutMs): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Network request timed out. Please check your backend connection.');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders(requiresAuth, !(options.body instanceof FormData));

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    let response: Response;
    try {
      if (__DEV__) console.log(`[API REQUEST] ${options.method || 'GET'} ${url}`);
      response = await this.fetchWithTimeout(url, config);
      if (__DEV__) console.log(`[API RESPONSE] ${response.status} ${url}`);
    } catch (e: any) {
      if (__DEV__) console.error(`[API NETWORK ERROR] ${url}:`, e?.message || e);
      throw new Error(e.message || 'Cannot reach server');
    }

    // If 401 Unauthorized and request required auth, attempt token refresh
    if (response.status === 401 && requiresAuth) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        const retryHeaders = await this.getHeaders(true, !(options.body instanceof FormData));
        response = await this.fetchWithTimeout(url, {
          ...options,
          headers: {
            ...retryHeaders,
            ...options.headers,
          },
        });
      }
    }

    if (!response.ok) {
      let errorDetail = 'Request failed';
      let errorCode: string | undefined = undefined;
      try {
        const errorData = await response.json();
        if (typeof errorData.detail === 'string') {
          errorDetail = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorDetail = errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        }
        if (errorData.code) {
          errorCode = errorData.code;
        }
      } catch {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      }
      const error: any = new Error(errorDetail);
      error.code = errorCode;
      error.status = response.status;
      throw error;
    }

    try {
      return (await response.json()) as T;
    } catch {
      return {} as T;
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) return false;

      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }, 4000);

      if (response.ok) {
        const data: AuthResponse = await response.json();
        await storage.saveAuthData(data.access_token, data.refresh_token, data.user);
        return true;
      } else {
        await storage.clearAuthData();
        return false;
      }
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Auth API Endpoints
  // -------------------------------------------------------------------------

  async getAuthStatus(): Promise<AuthStatusResponse> {
    return this.request<AuthStatusResponse>('/api/v1/auth/status', { method: 'GET' }, true);
  }

  async register(data: RegisterPayload): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>(
      '/api/v1/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      false
    );
    await storage.saveAuthData(res.access_token, res.refresh_token, res.user);
    return res;
  }

  async login(data: LoginPayload): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>(
      '/api/v1/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      false
    );
    await storage.saveAuthData(res.access_token, res.refresh_token, res.user);
    return res;
  }

  async logout(): Promise<void> {
    const refreshToken = await storage.getRefreshToken();
    if (refreshToken) {
      try {
        await this.fetchWithTimeout(`${this.baseUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }, 3000);
      } catch (e) {
        console.warn('Logout request failed:', e);
      }
    }
    await storage.clearAuthData();
  }

  async logoutAll(): Promise<void> {
    try {
      await this.request<{ message: string }>('/api/v1/auth/logout-all', { method: 'POST' }, true);
    } catch (e) {
      console.warn('Logout all request failed:', e);
    }
    await storage.clearAuthData();
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      '/api/v1/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
      false
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      '/api/v1/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword }),
      },
      false
    );
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      '/api/v1/auth/verify-email',
      {
        method: 'POST',
        body: JSON.stringify({ token }),
      },
      false
    );
  }

  // -------------------------------------------------------------------------
  // Users & Profiles Endpoints
  // -------------------------------------------------------------------------

  async getMe(): Promise<ApiUser> {
    return this.request<ApiUser>('/api/v1/users/me', { method: 'GET' }, true);
  }

  async getProfile(): Promise<StudentProfile> {
    return this.request<StudentProfile>('/api/v1/users/me/profile', { method: 'GET' }, true);
  }

  async createProfile(data: ProfilePayload): Promise<StudentProfile> {
    return this.request<StudentProfile>(
      '/api/v1/users/me/profile',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true
    );
  }

  async updateProfile(data: Partial<ProfilePayload>): Promise<StudentProfile> {
    return this.request<StudentProfile>(
      '/api/v1/users/me/profile',
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      true
    );
  }

  async uploadCollegeId(fileUri: string, mimeType: string, filename: string): Promise<StudentProfile> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: filename,
    } as any);

    return this.request<StudentProfile>(
      '/api/v1/users/me/profile/college-id',
      {
        method: 'POST',
        body: formData,
      },
      true
    );
  }

  // -------------------------------------------------------------------------
  // Identity Verification Endpoints
  // -------------------------------------------------------------------------

  async getVerificationStatus(): Promise<VerificationStatus> {
    return this.request<VerificationStatus>('/api/v1/verification/status', { method: 'GET' }, true);
  }

  async getColleges(search?: string): Promise<College[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<College[]>(`/api/v1/colleges${query}`, { method: 'GET' }, false);
  }

  async selectCollege(collegeId: string): Promise<VerificationStepResult> {
    return this.request<VerificationStepResult>(
      '/api/v1/verification/college',
      {
        method: 'POST',
        body: JSON.stringify({ college_id: collegeId }),
      },
      true
    );
  }

  async uploadVerificationCollegeId(fileUri: string, mimeType: string, filename: string): Promise<VerificationStepResult> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: filename,
    } as any);

    return this.request<VerificationStepResult>(
      '/api/v1/verification/college-id',
      {
        method: 'POST',
        body: formData,
      },
      true
    );
  }

  async enrollFace(fileUri: string, mimeType: string, filename: string): Promise<VerificationStepResult> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: filename,
    } as any);

    return this.request<VerificationStepResult>(
      '/api/v1/verification/face',
      {
        method: 'POST',
        body: formData,
      },
      true
    );
  }

  // -------------------------------------------------------------------------
  // Internship Endpoints
  // -------------------------------------------------------------------------

  async getInternships(): Promise<Internship[]> {
    return this.request<Internship[]>('/api/v1/internships', { method: 'GET' }, true);
  }

  async getActiveInternship(): Promise<Internship | null> {
    try {
      return await this.request<Internship | null>('/api/v1/internships/active', { method: 'GET' }, true);
    } catch {
      return null;
    }
  }

  async createInternship(data: InternshipCreatePayload): Promise<Internship> {
    return this.request<Internship>(
      '/api/v1/internships',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true
    );
  }

  async updateInternship(id: string, data: Partial<InternshipCreatePayload & { is_active?: boolean }>): Promise<Internship> {
    return this.request<Internship>(
      `/api/v1/internships/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      true
    );
  }

  async deleteInternship(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/v1/internships/${id}`,
      {
        method: 'DELETE',
      },
      true
    );
  }

  async setActiveInternship(id: string): Promise<Internship> {
    return this.request<Internship>(
      `/api/v1/internships/${id}/set-active`,
      {
        method: 'POST',
      },
      true
    );
  }

  async updateInternshipStatus(
    id: string,
    verification_stage: string,
    status?: string,
    rejection_reason?: string
  ): Promise<Internship> {
    return this.request<Internship>(
      `/api/v1/internships/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ verification_stage, status, rejection_reason }),
      },
      true
    );
  }

  async uploadInternshipProof(
    fileUri: string,
    mimeType: string,
    filename: string
  ): Promise<{ storage_ref: string; filename: string; content_type: string; url: string }> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: filename,
    } as any);

    return this.request<{ storage_ref: string; filename: string; content_type: string; url: string }>(
      '/api/v1/internships/upload-proof',
      {
        method: 'POST',
        body: formData,
      },
      true
    );
  }
}

export const api = new ApiService();

