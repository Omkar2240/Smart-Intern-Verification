"use client";

import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SuperAdminDashboard } from "@/components/dashboards/SuperAdminDashboard";
import { CollegeAdminDashboard } from "@/components/dashboards/CollegeAdminDashboard";
import { DeptAdminDashboard } from "@/components/dashboards/DeptAdminDashboard";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { AnalyticsSummary, Department, Student, AttendanceAnalytics } from "@/types/admin";

interface Props {
  analytics: AnalyticsSummary | null;
  attendanceAnalytics: AttendanceAnalytics | null;
  departments: Department[];
  recentStudents: Student[];
}

const ROLE_TITLES: Record<string, { title: string; description: string }> = {
  super_admin: {
    title: "System Verification Command Center",
    description: "Global overview of all colleges, students, and internship activities.",
  },
  admin: {
    title: "Platform Administration Center",
    description: "Platform-wide control — colleges, admins, verifications & internships.",
  },
  college_admin: {
    title: "College Verification Center",
    description: "Your college overview — students, departments, and internship activities.",
  },
  department_admin: {
    title: "Department Verification Queue",
    description: "Your department — students, verifications, and internship tracking.",
  },
};

export function DashboardShell({ analytics, attendanceAnalytics, departments, recentStudents }: Props) {
  const { user } = useAdminAuth();
  const role = user?.role ?? "department_admin";
  const config = ROLE_TITLES[role] ?? ROLE_TITLES.department_admin;

  const pendingCount = analytics?.pending_reviews;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar pendingReviewCount={pendingCount && pendingCount > 0 ? pendingCount : undefined} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={config.title} description={config.description} />

        <main className="flex-1 p-6 overflow-y-auto">
          {role === "super_admin" || role === "admin" ? (
            <SuperAdminDashboard
              analytics={analytics}
              attendanceAnalytics={attendanceAnalytics}
            />
          ) : role === "college_admin" ? (
            <CollegeAdminDashboard
              analytics={analytics}
              departments={departments}
              attendanceAnalytics={attendanceAnalytics}
            />
          ) : (
            <DeptAdminDashboard
              analytics={analytics}
              recentStudents={recentStudents}
              attendanceAnalytics={attendanceAnalytics}
            />
          )}
        </main>
      </div>
    </div>
  );
}
