import type { AdminRole } from "@/types/admin.types";

// Role definitions
export const ROLE = {
  SUPER_ADMIN: "super_admin" as AdminRole,
  ADMIN: "admin" as AdminRole,
  COLLEGE_ADMIN: "college_admin" as AdminRole,
  DEPARTMENT_ADMIN: "department_admin" as AdminRole,
  STUDENT: "student" as AdminRole,
} as const;

// Future role placeholder for mentor module:
// INDUSTRY_ADMIN: "industry_admin" as AdminRole - Internship team lead or HR from industry

// Human-readable labels
export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Platform Admin",
  college_admin: "College Admin",
  department_admin: "Department Admin",
  student: "Student",
};

// Tailwind color schemes per role
export const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  super_admin: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: "text-purple-600",
  },
  admin: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: "text-indigo-600",
  },
  college_admin: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    icon: "text-sky-600",
  },
  department_admin: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "text-emerald-600",
  },
  student: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: "text-slate-600",
  },
};

// What actions each role can perform
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    "view_all_colleges",
    "create_college",
    "edit_college",
    "view_all_departments",
    "create_department",
    "edit_department",
    "view_all_admins",
    "create_college_admin",
    "create_department_admin",
    "toggle_admin_status",
    "view_all_students",
    "view_analytics",
    "view_audit_logs",
  ],
  admin: [
    "view_all_colleges",
    "create_college",
    "edit_college",
    "view_all_departments",
    "create_department",
    "edit_department",
    "view_all_admins",
    "create_college_admin",
    "create_department_admin",
    "toggle_admin_status",
    "view_all_students",
    "view_analytics",
  ],
  college_admin: [
    "view_college_departments",
    "create_department",
    "edit_department",
    "view_college_admins",
    "create_department_admin",
    "toggle_admin_status",
    "view_college_students",
    "view_college_analytics",
  ],
  department_admin: [
    "view_department_students",
    "view_department_analytics",
    "review_verifications",
    "manage_internships",
    "manage_attendance",
  ],
};

// Navigation pages accessible per role
export const ROLE_NAVIGATION: Record<string, string[]> = {
  super_admin: ["/", "/verifications", "/internships", "/colleges", "/departments", "/admin-users", "/students", "/attendance"],
  admin: ["/", "/verifications", "/internships", "/colleges", "/departments", "/admin-users", "/students", "/attendance"],
  college_admin: ["/", "/verifications", "/internships", "/departments", "/admin-users", "/students", "/attendance"],
  department_admin: ["/", "/verifications", "/internships", "/students", "/attendance"],
};

// Which roles can create which roles
export const CAN_CREATE_ROLES: Record<string, AdminRole[]> = {
  super_admin: ["college_admin", "department_admin"],
  admin: ["college_admin", "department_admin"],
  college_admin: ["department_admin"],
  department_admin: [],
};
