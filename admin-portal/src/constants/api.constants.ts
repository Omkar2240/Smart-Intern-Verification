// API base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://trackintern-backend.onrender.com/api/v1";

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/auth/login",
  CURRENT_USER: "/users/me",

  // Analytics
  ANALYTICS_SUMMARY: "/admin/analytics/summary",

  // Verifications
  VERIFICATIONS: "/admin/verifications",
  APPROVE_VERIFICATION: (userId: string) => `/admin/verifications/${userId}/approve`,
  REJECT_VERIFICATION: (userId: string) => `/admin/verifications/${userId}/reject`,
  RESET_BIOMETRICS: (userId: string) => `/admin/verifications/${userId}/reset-biometrics`,
  FORCE_VERIFY: (userId: string) => `/admin/verifications/${userId}/force-verify`,

  // Internships
  INTERNSHIPS: "/admin/internships",
  INTERNSHIP_STATUS: (id: string) => `/admin/internships/${id}/status`,

  // Colleges
  COLLEGES: "/colleges",
  CREATE_COLLEGE: "/admin/colleges",
  UPDATE_COLLEGE: (id: string) => `/admin/colleges/${id}`,
  ROSTER_UPLOAD: (id: string) => `/admin/colleges/${id}/roster/upload`,

  // Departments (future real API endpoints)
  DEPARTMENTS: "/admin/departments",
  CREATE_DEPARTMENT: "/admin/departments",
  UPDATE_DEPARTMENT: (id: string) => `/admin/departments/${id}`,

  // Admin Users (future real API endpoints)
  ADMIN_USERS: "/admin/users",
  CREATE_ADMIN_USER: "/admin/users",
  TOGGLE_ADMIN_STATUS: (id: string) => `/admin/users/${id}/toggle-status`,
} as const;

// Error codes
export const ERROR_CODES = {
  AUTH_REQUIRED: "Authentication required",
  INVALID_CREDENTIALS: "Invalid email or password",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  UNAUTHORIZED: "You do not have permission to perform this action.",
  DEPARTMENT_NOT_FOUND: "Department not found",
  COLLEGE_NOT_FOUND: "College not found",
  USER_NOT_FOUND: "User not found",
  EMAIL_TAKEN: "This email address is already registered",
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_PASSWORD: "Password must be at least 8 characters",
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Server error. Please try again later.",
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;
