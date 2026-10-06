// Admin Role Types
export type AdminRole = "super_admin" | "admin" | "college_admin" | "department_admin" | "student";

// Future role placeholder for mentor module:
// export type AdminRole = "super_admin" | "admin" | "college_admin" | "department_admin" | "industry_admin" | "student";

// Admin assignment links user to college/department
export interface AdminAssignment {
  user_id: string;
  college_id?: string | null;
  department_id?: string | null;
  role: AdminRole;
}

// Extended admin user used in admin-users management page
export interface AdminUserExtended {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  college_id?: string | null;
  college_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  is_active: boolean;
  created_at: string;
  last_login?: string | null;
}

// Create/Update payloads
export interface AdminUserCreate {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  college_id?: string | null;
  department_id?: string | null;
}

export interface AdminUserUpdate {
  name?: string;
  email?: string;
  role?: AdminRole;
  college_id?: string | null;
  department_id?: string | null;
  is_active?: boolean;
}
