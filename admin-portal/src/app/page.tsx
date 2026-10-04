"use client";

import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { SuperAdminDashboard } from "@/components/dashboards/SuperAdminDashboard";
import { CollegeAdminDashboard } from "@/components/dashboards/CollegeAdminDashboard";
import { DeptAdminDashboard } from "@/components/dashboards/DeptAdminDashboard";
import { mockAnalytics } from "@/data/mock/analytics.mock";

const roleConfig: Record<string, { title: string; description: string }> = {
  super_admin: {
    title: "System Verification Command Center",
    description: "Global overview of all colleges, students, and internship activities.",
  },
  college_admin: {
    title: "College Verification Center",
    description: "G.H. Raisoni College of Engineering & Management · Your college data only",
  },
  department_admin: {
    title: "Department Verification Queue",
    description: "Computer Science & Engineering · G.H. Raisoni College of Engineering & Management",
  },
};

function DashboardContent() {
  const { user, isLoading } = useAdminAuth();
  const role = user?.role || "department_admin";
  const config = roleConfig[role] || roleConfig.department_admin;
  const pendingCount = mockAnalytics[role]?.pending_reviews;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
          </div>
          <p className="font-mono text-xs text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar pendingReviewCount={pendingCount} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={config.title} description={config.description} />

        <main className="flex-1 p-6 overflow-y-auto">
          {role === "super_admin" || role === "admin" ? (
            <SuperAdminDashboard />
          ) : role === "college_admin" ? (
            <CollegeAdminDashboard />
          ) : (
            <DeptAdminDashboard />
          )}
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
