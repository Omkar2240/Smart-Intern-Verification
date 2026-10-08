import type { AnalyticsSummary } from "@/types/admin";

interface RoleAnalytics extends AnalyticsSummary {
  active_departments?: number;
  today_attendance?: number;
  avg_attendance_rate?: number;
}

export const mockAnalytics: Record<string, RoleAnalytics> = {
  // Super Admin: global stats
  super_admin: {
    total_users: 7820,
    verified_users: 5940,
    pending_reviews: 143,
    rejected_verifications: 287,
    active_colleges: 3,
    active_departments: 26,
    total_internships: 1240,
    pending_internships: 312,
    verified_internships: 896,
    today_attendance: 4280,
    avg_attendance_rate: 87,
  },
  // Platform Admin: global stats (similar to super_admin)
  admin: {
    total_users: 7820,
    verified_users: 5940,
    pending_reviews: 143,
    rejected_verifications: 287,
    active_colleges: 3,
    active_departments: 26,
    total_internships: 1240,
    pending_internships: 312,
    verified_internships: 896,
    today_attendance: 4280,
    avg_attendance_rate: 87,
  },
  // College Admin: single college stats (GHRCE)
  college_admin: {
    total_users: 2400,
    verified_users: 1870,
    pending_reviews: 52,
    rejected_verifications: 94,
    active_colleges: 1,
    active_departments: 8,
    total_internships: 380,
    pending_internships: 95,
    verified_internships: 262,
    today_attendance: 1840,
    avg_attendance_rate: 83,
  },
  // Department Admin: single department stats (CSE)
  department_admin: {
    total_users: 420,
    verified_users: 320,
    pending_reviews: 18,
    rejected_verifications: 22,
    active_colleges: 1,
    active_departments: 1,
    total_internships: 38,
    pending_internships: 12,
    verified_internships: 24,
    today_attendance: 310,
    avg_attendance_rate: 88,
  },
};
