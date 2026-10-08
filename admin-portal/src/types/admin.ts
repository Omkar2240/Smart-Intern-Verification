// ─── Core Role Types ──────────────────────────────────────────────────────────

export type VerificationStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "manual_review"
  | "rejected";

export type InternshipStage =
  | "submitted"
  | "tp_review"
  | "mentor_review"
  | "verified"
  | "rejected";

export type InternshipType = "on_site" | "remote" | "hybrid";

// ─── User / Auth ───────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "college_admin" | "department_admin" | "student";
  college_id?: string | null;
  college_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  is_active?: boolean;
  created_at?: string;
  last_login?: string | null;
}

export interface LoginResponse {
  access_token: string;
  user: AdminUser;
}

// ─── Verification ──────────────────────────────────────────────────────────────

export interface VerificationItem {
  user_id: string;
  user_name: string;
  user_email: string;
  registration_number: string;
  mobile_number: string;
  college_id?: string | null;
  college_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  college_status: string;
  college_id_status: VerificationStatus;
  face_status: VerificationStatus;
  overall_status: VerificationStatus;
  extracted_metadata?: {
    extracted_text?: string;
    fields?: {
      college_name?: string;
      student_name?: string;
      registration_number?: string;
      department?: string;
      valid_until?: string;
    };
    verification?: {
      college_match?: boolean;
      name_match?: boolean;
      reg_no_match?: boolean;
      status?: string;
      confidence_score?: number;
    };
  } | null;
  rejection_reason?: string | null;
  has_card_image: boolean;
  card_image_url?: string | null;
  has_face_embedding: boolean;
  is_verified?: boolean;
  internships?: InternshipItem[];
  created_at: string;
  verified_at?: string | null;
}

export interface VerificationListResponse {
  total: number;
  items: VerificationItem[];
  page: number;
  page_size: number;
}

// ─── Internship ────────────────────────────────────────────────────────────────

export interface InternshipItem {
  id: string;
  user_id: string;
  company_name: string;
  role: string;
  department?: string | null;
  internship_type: InternshipType | string;
  location?: string | null;
  supervisor_name?: string | null;
  supervisor_email?: string | null;
  supervisor_phone?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  stipend?: string | null;
  offer_letter_url?: string | null;
  workplace_lat?: number | null;
  workplace_lng?: number | null;
  verification_stage: InternshipStage;
  status: "pending" | "verified" | "rejected" | string;
  rejection_reason?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminInternshipItem extends InternshipItem {
  student_name: string;
  student_email: string;
  student_registration_number: string;
  student_mobile: string;
  college_name?: string | null;
}

export interface AdminInternshipListResponse {
  total: number;
  items: AdminInternshipItem[];
  page: number;
  page_size: number;
}

export interface UpdateInternshipStatusPayload {
  verification_stage: InternshipStage | string;
  status: "pending" | "verified" | "rejected";
  rejection_reason?: string | null;
}

// ─── College ────────────────────────────────────────────────────────────────────

export interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  code?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CollegeListResponse {
  total: number;
  items: College[];
  page: number;
  page_size: number;
}

export interface CreateCollegePayload {
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
}

export interface UpdateCollegePayload {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  code?: string;
  is_active?: boolean;
}

// ─── Department ─────────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  college_id: string;
  college_name?: string | null;
  name: string;
  code?: string | null;
  hod_name?: string | null;
  hod_email?: string | null;
  is_active: boolean;
  student_count: number;
  active_internships: number;
  created_at?: string;
}

export interface CreateDepartmentPayload {
  college_id?: string; // omitted for college_admin (auto-assigned server-side)
  name: string;
  code: string;
  hod_name?: string;
  hod_email?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  code?: string;
  hod_name?: string;
  hod_email?: string;
  is_active?: boolean;
}

// ─── Admin User Management ──────────────────────────────────────────────────────

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: AdminUser["role"];
  college_id?: string | null;
  college_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  is_active: boolean;
  last_login?: string | null;
  created_at: string;
}

export interface AdminUserListResponse {
  total: number;
  items: AdminUserListItem[];
  page: number;
  page_size: number;
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  password: string;
  role: "college_admin" | "department_admin" | "admin";
  college_id?: string | null;
  department_id?: string | null;
  permissions?: string[];
}

export interface AdminPermissionOption {
  key: string;
  label: string;
  description: string;
}

// ─── Student ────────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  email: string;
  registration_number: string;
  mobile_number?: string | null;
  college_id?: string | null;
  college_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  verification_status: VerificationStatus;
  internship_status: "active" | "completed" | "not_started" | string;
  attendance_rate?: number | null;
  is_verified: boolean;
  created_at: string;
}

export interface StudentListResponse {
  total: number;
  items: Student[];
  page: number;
  page_size: number;
}

export interface CreateStudentPayload {
  name: string;
  registration_number?: string;
  email?: string;
  mobile_number?: string;
  password?: string;
  college_id?: string;
  department_id: string;
}

export type UpdateStudentPayload = Partial<CreateStudentPayload>;

// ─── Attendance ─────────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  department_id?: string | null;
  department_name?: string | null;
  company_name?: string | null;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  status: "present" | "absent" | "late" | string;
  attendance_rate?: number | null;
  work_mode?: "offline" | "online" | string | null;
  location_verified?: boolean | null;
  check_in_lat?: number | null;
  check_in_lng?: number | null;
}

export interface AttendanceListResponse {
  total: number;
  items: AttendanceRecord[];
  page: number;
  page_size: number;
}

export interface AttendanceAnalytics {
  average_attendance_rate: number;
  present_today: number;
  absent_today: number;
  late_today: number;
  monthly_trend: Array<{ month: string; rate: number }>;
  department_breakdown?: Array<{
    department_id: string;
    department_name: string;
    present: number;
    absent: number;
    late: number;
  }>;
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  total_users: number;
  verified_users: number;
  pending_reviews: number;
  rejected_verifications: number;
  active_colleges: number;
  total_internships?: number;
  pending_internships?: number;
  verified_internships?: number;
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface PlatformTrendData {
  period: string;
  user_registrations: TrendDataPoint[];
  user_logins: TrendDataPoint[];
  college_creations: TrendDataPoint[];
}

export interface PlatformTrendResponse {
  data: PlatformTrendData;
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  action: "approve" | "reject" | "create" | "update" | "delete" | "reset" | string;
  entity_type: "verification" | "internship" | "college" | "department" | "admin" | string;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  total: number;
  items: AuditLog[];
  page: number;
  page_size: number;
}

// ─── System Config ───────────────────────────────────────────────────────────────

export interface SystemConfig {
  verification_timeout_days: number;
  max_upload_size_mb: number;
  allowed_file_types: string[];
  enable_ocr: boolean;
  enable_face_recognition: boolean;
  face_confidence_threshold: number;
}

// ─── Generic Response Types ──────────────────────────────────────────────────────

export interface ActionResponse {
  success: boolean;
  message: string;
  overall_status?: string | null;
}

export interface RosterUploadResponse {
  success: boolean;
  added_count: number;
  skipped_count: number;
  message: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

// ─── Query Params Helpers ─────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface VerificationFilterParams extends PaginationParams {
  status?: VerificationStatus | "all";
  search?: string;
  college_id?: string;
  department_id?: string;
}

export interface InternshipFilterParams extends PaginationParams {
  stage?: InternshipStage | "all";
  status?: "pending" | "verified" | "rejected" | "all";
  search?: string;
  college_id?: string;
  department_id?: string;
}

export interface StudentFilterParams extends PaginationParams {
  college_id?: string;
  department_id?: string;
  verification_status?: VerificationStatus | "all";
  internship_status?: string;
  search?: string;
}

export interface AttendanceFilterParams extends PaginationParams {
  department_id?: string;
  date?: string;
  date_filter?: "today" | "week" | "month";
  status?: "present" | "absent" | "late" | "all";
  search?: string;
}

export interface AdminUserFilterParams extends PaginationParams {
  role?: "super_admin" | "admin" | "college_admin" | "department_admin" | "all";
  college_id?: string;
  search?: string;
}

export interface AuditLogFilterParams extends PaginationParams {
  admin_id?: string;
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface CollegeAdminFilterParams extends PaginationParams {
  search?: string;
  include_inactive?: boolean;
}
