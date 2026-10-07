"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Search,
  Plus,
  Edit,
  Power,
  Users,
  Briefcase,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { ActiveBadge } from "@/components/StatusBadges";
import { EmptyState, ErrorBanner } from "@/components/UiStates";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import type {
  Department,
  College,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from "@/types/admin";
import { clsx } from "clsx";

interface Props {
  initialDepartments: Department[];
  colleges: College[];
}

const DEPT_COLORS = [
  "from-sky-50 to-blue-100 border-sky-200 text-sky-700",
  "from-purple-50 to-indigo-100 border-purple-200 text-purple-700",
  "from-emerald-50 to-teal-100 border-emerald-200 text-emerald-700",
  "from-amber-50 to-orange-100 border-amber-200 text-amber-700",
  "from-rose-50 to-pink-100 border-rose-200 text-rose-700",
  "from-violet-50 to-purple-100 border-violet-200 text-violet-700",
];

const EMPTY_CREATE: CreateDepartmentPayload = {
  name: "",
  code: "",
  hod_name: "",
  hod_email: "",
  college_id: "",
};

export function DepartmentsClient({ initialDepartments, colleges }: Props) {
  const { user } = useAdminAuth();
  const role = user?.role ?? "college_admin";
  const isPlatformAdmin = role === "super_admin" || role === "admin";

  const [departments, setDepartments] = useState<Department[]>(
    Array.isArray(initialDepartments) ? initialDepartments : [],
  );
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [formData, setFormData] =
    useState<CreateDepartmentPayload>(EMPTY_CREATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 250);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return departments;
    const q = debouncedSearch.toLowerCase();
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q) ||
        d.hod_name?.toLowerCase().includes(q),
    );
  }, [departments, debouncedSearch]);

  const active = departments.filter((d) => d.is_active).length;
  const totalStudents = departments.reduce(
    (a, d) => a + (d.student_count || 0),
    0,
  );
  const totalInterns = departments.reduce(
    (a, d) => a + (d.active_internships || 0),
    0,
  );

  // ── Create / Edit handlers ────────────────────────────────────────────────

  const openCreate = useCallback(() => {
    setFormData({
      ...EMPTY_CREATE,
      college_id: user?.college_id ?? colleges[0]?.id ?? "",
    });
    setEditDept(null);
    setError(null);
    setShowCreateModal(true);
  }, [user, colleges]);

  const openEdit = useCallback((dept: Department) => {
    setFormData({
      name: dept.name,
      code: dept.code ?? "",
      hod_name: dept.hod_name ?? "",
      hod_email: dept.hod_email ?? "",
      college_id: dept.college_id,
    });
    setEditDept(dept);
    setError(null);
    setShowCreateModal(true);
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      setError("Name and code are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editDept) {
        const updated = await api.updateDepartment(
          editDept.id,
          formData as UpdateDepartmentPayload,
        );
        setDepartments((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d)),
        );
      } else {
        const created = await api.createDepartment(formData);
        setDepartments((prev) => [created, ...prev]);
      }
      setShowCreateModal(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save department",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (dept: Department) => {
    setToggleLoading(dept.id);
    try {
      const updated = await api.updateDepartment(dept.id, {
        is_active: !dept.is_active,
      });
      setDepartments((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d)),
      );
    } catch {
      // ignore toggle error silently (badge reverts)
    } finally {
      setToggleLoading(null);
    }
  };

  const canManage = role !== "department_admin";

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Departments"
          description={
            isPlatformAdmin
              ? "All departments across the platform"
              : "Departments in your college"
          }
          actions={
            canManage ? (
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-sm shadow-sky-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Department
              </button>
            ) : null
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                title: "Total Departments",
                value: departments.length,
                icon: GraduationCap,
                color: "purple" as const,
              },
              {
                title: "Active",
                value: active,
                icon: CheckCircle2,
                color: "emerald" as const,
              },
              {
                title: "Total Students",
                value: totalStudents,
                icon: Users,
                color: "cyan" as const,
              },
              {
                title: "Active Interns",
                value: totalInterns,
                icon: Briefcase,
                color: "indigo" as const,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search departments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
              />
            </div>
          </div>

          {/* Departments Grid */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No departments found"
              description="Create a department to get started."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((dept, idx) => {
                const colorCls = DEPT_COLORS[idx % DEPT_COLORS.length];
                return (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-sky-200 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={clsx(
                          "w-10 h-10 rounded-xl border flex items-center justify-center font-extrabold text-xs bg-gradient-to-br shrink-0",
                          colorCls,
                        )}
                      >
                        {dept.code?.slice(0, 3) || "DEPT"}
                      </div>
                      <ActiveBadge isActive={dept.is_active} />
                    </div>

                    <h3 className="text-[13px] font-bold text-slate-900 mb-0.5 group-hover:text-sky-700 transition-colors leading-snug">
                      {dept.name}
                    </h3>
                    {dept.college_name && (
                      <p className="font-mono text-[10px] text-slate-400 mb-3 truncate">
                        {dept.college_name}
                      </p>
                    )}

                    {dept.hod_name && (
                      <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                        <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                          {dept.hod_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-900 truncate">
                            {dept.hod_name}
                          </p>
                          <p className="font-mono text-[9px] text-slate-500 truncate">
                            HOD · {dept.hod_email}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[16px] font-extrabold text-slate-900">
                          {(dept.student_count ?? 0).toLocaleString()}
                        </p>
                        <p className="font-mono text-[9px] text-slate-400 uppercase">
                          Students
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[16px] font-extrabold text-emerald-700">
                          {(dept.active_internships ?? 0).toLocaleString()}
                        </p>
                        <p className="font-mono text-[9px] text-slate-400 uppercase">
                          Interns
                        </p>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(dept)}
                          className="flex-1 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleToggle(dept)}
                          disabled={toggleLoading === dept.id}
                          className={clsx(
                            "p-1.5 rounded-xl border transition-all",
                            dept.is_active
                              ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
                              : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600",
                          )}
                        >
                          {toggleLoading === dept.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editDept ? "Edit Department" : "Add New Department"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <p className="text-[11px] text-rose-700">{error}</p>
                  </div>
                )}

                {/* College selector for platform admins */}
                {isPlatformAdmin && !editDept && (
                  <div>
                    <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      College
                    </label>
                    <select
                      value={formData.college_id}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          college_id: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="">Select a college...</option>
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {[
                  {
                    label: "Department Name *",
                    key: "name",
                    placeholder: "Computer Science & Engineering",
                  },
                  { label: "Short Code *", key: "code", placeholder: "CSE" },
                  {
                    label: "HOD Name",
                    key: "hod_name",
                    placeholder: "Dr. Ramesh Sharma",
                  },
                  {
                    label: "HOD Email",
                    key: "hod_email",
                    placeholder: "ramesh.sharma@college.edu",
                  },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={
                        formData[
                          field.key as keyof CreateDepartmentPayload
                        ] as string
                      }
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="p-5 pt-0 flex gap-2.5">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editDept ? "Save Changes" : "Create Department"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
