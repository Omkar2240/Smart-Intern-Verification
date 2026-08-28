import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';

// Smart API Base URL resolver:
// 1. Explicit EXPO_PUBLIC_API_URL (if provided)
// 2. Metro host IP when running via Expo Go / dev client over Wi-Fi
// 3. Default to localhost:8000 (works on Web, iOS simulator, and physical Android devices with `adb reverse tcp:8000 tcp:8000`)
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // If running via Expo Go, resolve the computer's LAN IP from Metro packager
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:8000`;
    }
  }

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
      response = await this.fetchWithTimeout(url, config);
    } catch (e: any) {
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
      try {
        const errorData = await response.json();
        if (typeof errorData.detail === 'string') {
          errorDetail = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorDetail = errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        }
      } catch {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorDetail);
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
}

export const api = new ApiService();
