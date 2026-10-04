"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GraduationCap, RefreshCw, Search, Plus, BookOpen } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DepartmentCard } from "@/components/admin/DepartmentCard";
import { ScopeIndicator } from "@/components/admin/ScopeIndicator";
import { CreateDepartmentModal } from "@/components/forms/CreateDepartmentModal";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { mockApi } from "@/lib/mockApi";
import type { DepartmentWithStats } from "@/types/department.types";
import type { College } from "@/types/admin";
import { ROLE_NAVIGATION } from "@/constants/roles.constants";

export default function DepartmentsPage() {
  const { user, isLoading: authLoading } = useAdminAuth();
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Role-based access
  const role = user?.role || "";
  const allowedPages = ROLE_NAVIGATION[role] || [];
  const canAccess = allowedPages.includes("/departments");
  const canCreate = role === "super_admin" || role === "college_admin";
  const lockedCollegeId = role === "college_admin" ? (user?.college_id || undefined) : undefined;

  const fetchData = useCallback(async () => {
    if (!canAccess) return;
    try {
      setIsLoading(true);
      const [depts, cols] = await Promise.all([
        mockApi.getDepartments(lockedCollegeId),
        mockApi.getColleges(),
      ]);
      setDepartments(depts);
      setColleges(cols);
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, lockedCollegeId]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  // Filtered departments based on search
  const filteredDepartments = departments.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.code?.toLowerCase() || "").includes(q) ||
      d.college_name.toLowerCase().includes(q) ||
      (d.hod_name?.toLowerCase() || "").includes(q)
    );
  });

  // Access denied guard
  if (!authLoading && !canAccess) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
            <p className="text-sm text-slate-500 mt-2">Department management is not available for your role.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Department Management"
          description="Manage academic departments across colleges. Create and assign department heads."
        />

        <main className="flex-1 p-8 space-y-7 overflow-y-auto">
          {/* Page Header */}
          <div className="animate-reveal-1 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Departments</h2>
                  <p className="text-xs text-slate-500">
                    {isLoading ? "Loading..." : `${filteredDepartments.length} department${filteredDepartments.length !== 1 ? "s" : ""} found`}
                  </p>
                </div>
              </div>
              {/* Scope indicator for college/department admins */}
              <ScopeIndicator collegeName={user?.college_name} departmentName={user?.department_name} />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, code, college..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 w-64 transition-all shadow-xs"
                />
              </div>

              {/* Refresh */}
              <button
                onClick={fetchData}
                disabled={isLoading}
                title="Refresh"
                className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
              </button>

              {/* Add Department */}
              {canCreate && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Department
                </button>
              )}
            </div>
          </div>

          {/* Department Grid */}
          <div className="animate-reveal-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto mb-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
                  </div>
                  <p className="font-mono text-xs text-slate-700">Loading departments...</p>
                </div>
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4 text-slate-400">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No departments found</h3>
                <p className="text-xs text-slate-500 mt-1.5 text-center max-w-xs">
                  {searchQuery
                    ? "Try adjusting your search query."
                    : canCreate
                    ? "Get started by creating the first department."
                    : "No departments have been created yet."}
                </p>
                {canCreate && !searchQuery && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Create Department
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDepartments.map((dept) => (
                  <DepartmentCard
                    key={dept.id}
                    department={dept}
                    canEdit={canCreate}
                    onEdit={() => {/* TODO: edit modal */}}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Department Modal */}
      <CreateDepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        colleges={colleges}
        lockedCollegeId={lockedCollegeId}
      />
    </div>
  );
}
