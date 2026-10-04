/**
 * Mock API Service
 * Provides mock data for development/testing.
 * To switch to real API, set NEXT_PUBLIC_USE_MOCK_API=false in .env.local
 */

import type { DepartmentWithStats, DepartmentCreate, DepartmentUpdate } from "@/types/department.types";
import type { AdminUserExtended, AdminUserCreate } from "@/types/admin.types";
import { mockDepartments } from "@/data/mock/departments.mock";
import { mockAdminUsers } from "@/data/mock/adminUsers.mock";
import { mockColleges } from "@/data/mock/colleges.mock";
import { mockAnalytics } from "@/data/mock/analytics.mock";
import type { AnalyticsSummary, College } from "@/types/admin";

// Simulate network delay (ms)
const MOCK_DELAY = 400;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

class MockApiClient {
  // In-memory store (resets on page refresh)
  private departments: DepartmentWithStats[] = [...mockDepartments];
  private adminUsers: AdminUserExtended[] = [...mockAdminUsers];

  // ── Colleges ──────────────────────────────────────────────────────────────
  async getColleges(search?: string): Promise<College[]> {
    await delay(MOCK_DELAY);
    let result = mockColleges as College[];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
      );
    }
    return result;
  }

  // ── Departments ───────────────────────────────────────────────────────────
  async getDepartments(collegeId?: string): Promise<DepartmentWithStats[]> {
    await delay(MOCK_DELAY);
    if (collegeId) {
      return this.departments.filter((d) => d.college_id === collegeId);
    }
    return [...this.departments];
  }

  async createDepartment(data: DepartmentCreate): Promise<DepartmentWithStats> {
    await delay(MOCK_DELAY);
    const college = mockColleges.find((c) => c.id === data.college_id);
    if (!college) throw new Error("College not found");

    const newDept: DepartmentWithStats = {
      id: `dept-${Date.now()}`,
      college_id: data.college_id,
      college_name: college.name,
      name: data.name,
      code: data.code || null,
      hod_name: data.hod_name || null,
      hod_email: data.hod_email || null,
      student_count: 0,
      active_internships: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.departments = [newDept, ...this.departments];
    return newDept;
  }

  async updateDepartment(id: string, data: DepartmentUpdate): Promise<DepartmentWithStats> {
    await delay(MOCK_DELAY);
    const idx = this.departments.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Department not found");
    this.departments[idx] = { ...this.departments[idx], ...data };
    return this.departments[idx];
  }

  // ── Admin Users ───────────────────────────────────────────────────────────
  async getAdminUsers(collegeId?: string): Promise<AdminUserExtended[]> {
    await delay(MOCK_DELAY);
    if (collegeId) {
      return this.adminUsers.filter((u) => u.college_id === collegeId);
    }
    return [...this.adminUsers];
  }

  async createAdminUser(data: AdminUserCreate): Promise<AdminUserExtended> {
    await delay(MOCK_DELAY);
    // Check email uniqueness
    if (this.adminUsers.some((u) => u.email === data.email)) {
      throw new Error("This email address is already registered");
    }
    const college = data.college_id
      ? mockColleges.find((c) => c.id === data.college_id)
      : null;
    const dept = data.department_id
      ? this.departments.find((d) => d.id === data.department_id)
      : null;

    const newUser: AdminUserExtended = {
      id: `admin-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      college_id: data.college_id || null,
      college_name: college?.name || null,
      department_id: data.department_id || null,
      department_name: dept?.name || null,
      is_active: true,
      created_at: new Date().toISOString(),
      last_login: null,
    };
    this.adminUsers = [newUser, ...this.adminUsers];
    return newUser;
  }

  async toggleAdminStatus(userId: string): Promise<AdminUserExtended> {
    await delay(MOCK_DELAY);
    const idx = this.adminUsers.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error("Admin user not found");
    this.adminUsers[idx] = {
      ...this.adminUsers[idx],
      is_active: !this.adminUsers[idx].is_active,
    };
    return this.adminUsers[idx];
  }

  // ── Analytics ─────────────────────────────────────────────────────────────
  async getAnalyticsByRole(role: string): Promise<AnalyticsSummary> {
    await delay(MOCK_DELAY);
    return mockAnalytics[role] || mockAnalytics.department_admin;
  }
}

export const mockApi = new MockApiClient();
