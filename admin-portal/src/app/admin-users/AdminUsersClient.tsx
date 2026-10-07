"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Search, Plus, Power, Crown, Award,
  BookOpen, CheckCircle2, XCircle, Mail, X, Loader2, Eye, EyeOff,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { PaginationBar } from "@/components/PaginationBar";
import { TableSkeleton, ErrorBanner, EmptyState } from "@/components/UiStates";
import { ActiveBadge } from "@/components/StatusBadges";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { ROLE_LABELS, ROLE_COLORS, CAN_CREATE_ROLES } from "@/constants/roles.constants";
import type {
  AdminUserListResponse, AdminUserListItem, College, CreateAdminUserPayload, AdminUserFilterParams,
} from "@/types/admin";
import { clsx } from "clsx";

interface Props {
  initialData: AdminUserListResponse | null;
  colleges: College[];
}

const ROLE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  super_admin: Crown,
  admin: Shield,
  college_admin: Award,
  department_admin: BookOpen,
};

const EMPTY_FORM: CreateAdminUserPayload = {
  name: "", email: "", password: "", role: "department_admin",
  college_id: null, department_id: null,
};

export function AdminUsersClient({ initialData, colleges }: Props) {
  const { user } = useAdminAuth();
  const role = user?.role ?? "college_admin";
  const isPlatformAdmin = role === "super_admin" || role === "admin";
  const canCreateRoles = CAN_CREATE_ROLES[role] ?? [];

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateAdminUserPayload>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deptOptions, setDeptOptions] = useState<{ id: string; name: string }[]>([]);
  const requestedRole = roleFilter === "all" ? undefined : roleFilter;
  const adminListRole = isPlatformAdmin ? requestedRole : "department_admin";

  // ── Fetch list ────────────────────────────────────────────────────────────
  const { data, loading, error, refetch } = useApi(
    () => api.getAdminUsers({
      search: debouncedSearch || undefined,
      role: adminListRole as AdminUserFilterParams["role"],
      page, page_size: 20,
    }),
    [debouncedSearch, adminListRole, page],
  );

  const items = data?.items ?? initialData?.items ?? [];
  const total = data?.total ?? initialData?.total ?? 0;

  const activeCount = items.filter((a) => a.is_active).length;
  const superAdmins = items.filter((a) => a.role === "super_admin" || a.role === "admin").length;
  const collegeAdmins = items.filter((a) => a.role === "college_admin").length;
  const deptAdmins = items.filter((a) => a.role === "department_admin").length;

  // ── Handle college change (load depts) ────────────────────────────────────
  const handleCollegeChange = useCallback(async (collegeId: string) => {
    setForm((p) => ({ ...p, college_id: collegeId, department_id: null }));
    if (!collegeId) { setDeptOptions([]); return; }
    try {
      const depts = await api.getAdminDepartments({ college_id: collegeId });
      setDeptOptions(depts.map((d) => ({ id: d.id, name: d.name })));
    } catch { setDeptOptions([]); }
  }, []);

  // ── Create admin ──────────────────────────────────────────────────────────
  const openCreate = () => {
    const defaultCollegeId = isPlatformAdmin ? "" : (user?.college_id ?? "");
    setForm({ ...EMPTY_FORM, role: (canCreateRoles[0] ?? "department_admin") as CreateAdminUserPayload["role"], college_id: defaultCollegeId || null });
    setFormError(null);
    setShowPassword(false);
    setShowModal(true);
    if (defaultCollegeId) handleCollegeChange(defaultCollegeId);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.password) {
      setFormError("Name, email and password are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.createAdminUser(form);
      await refetch();
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle status ──────────────────────────────────────────────────────────
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const handleToggle = async (admin: AdminUserListItem) => {
    setTogglingId(admin.id);
    try {
      await api.toggleAdminStatus(admin.id, !admin.is_active);
      await refetch();
    } catch { /* ignore */ }
    finally { setTogglingId(null); }
  };

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleRoleFilter = (v: string) => { setRoleFilter(v); setPage(1); };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Admin Users"
          description={isPlatformAdmin ? "All admin accounts across the platform" : "Department admins in your college"}
          actions={
            canCreateRoles.length > 0 ? (
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Admin
              </button>
            ) : null
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(isPlatformAdmin
              ? [
                  { title: "Total Admins", value: total, icon: Shield, color: "purple" as const },
                  { title: "Platform Admins", value: superAdmins, icon: Crown, color: "violet" as const },
                  { title: "College Admins", value: collegeAdmins, icon: Award, color: "cyan" as const },
                  { title: "Dept. Admins", value: deptAdmins, icon: BookOpen, color: "emerald" as const },
                ]
              : [
                  { title: "Dept. Admins", value: total, icon: Shield, color: "emerald" as const },
                  { title: "Active", value: activeCount, icon: CheckCircle2, color: "emerald" as const },
                  { title: "Inactive", value: total - activeCount, icon: XCircle, color: "rose" as const },
                  { title: "Can Create", value: canCreateRoles.length, icon: Plus, color: "cyan" as const },
                ]
            ).map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Table Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
          >
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200"><Shield className="w-4 h-4 text-purple-600" /></div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Admin Accounts</h3>
                  <p className="font-mono text-[10px] text-slate-500">{total.toLocaleString()} records</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" placeholder="Search admins..." value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-48 transition-all"
                  />
                </div>
                {isPlatformAdmin && (
                  <select value={roleFilter} onChange={(e) => handleRoleFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Platform Admin</option>
                    <option value="college_admin">College Admin</option>
                    <option value="department_admin">Dept. Admin</option>
                  </select>
                )}
              </div>
            </div>

            {error && <ErrorBanner message={error} onRetry={refetch} />}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {["Admin", "Role", "College / Dept.", "Last Login", "Status", "Actions"].map((col) => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6}><TableSkeleton rows={8} cols={6} /></td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={6}><EmptyState icon={Shield} title="No admins found" /></td></tr>
                  ) : (
                    items.map((admin, idx) => {
                      const roleColor = ROLE_COLORS[admin.role];
                      const RoleIcon = ROLE_ICON_MAP[admin.role] ?? Shield;
                      return (
                        <motion.tr key={admin.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[11px] border shrink-0", roleColor?.bg, roleColor?.border, roleColor?.text)}>
                                {admin.name?.[0]?.toUpperCase() ?? "A"}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">{admin.name}</p>
                                <p className="font-mono text-[10px] text-slate-500 flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{admin.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={clsx("flex items-center gap-1.5 w-fit font-mono text-[9px] font-bold px-2 py-1 rounded-full border", roleColor?.bg, roleColor?.border, roleColor?.text)}>
                              <RoleIcon className="w-2.5 h-2.5" />
                              {ROLE_LABELS[admin.role] ?? admin.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="text-[11px] font-medium text-slate-700">{admin.college_name ?? "—"}</p>
                            <p className="font-mono text-[10px] text-slate-400">{admin.department_name ?? "All Departments"}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600">
                            {admin.last_login ? new Date(admin.last_login).toLocaleDateString("en-IN") : "Never"}
                          </td>
                          <td className="py-3.5 px-4"><ActiveBadge isActive={admin.is_active} /></td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggle(admin)}
                              disabled={togglingId === admin.id || admin.id === user?.id}
                              title={admin.is_active ? "Deactivate" : "Activate"}
                              className={clsx("p-1.5 rounded-lg border transition-all disabled:opacity-40",
                                admin.is_active
                                  ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
                                  : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600"
                              )}
                            >
                              {togglingId === admin.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar page={page} pageSize={20} total={total} onPageChange={setPage} />
          </motion.div>
        </main>
      </div>

      {/* Create Admin Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Create Admin Account</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <p className="text-[11px] text-rose-700">{formError}</p>
                  </div>
                )}

                {/* Role */}
                <div>
                  <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Role</label>
                  <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as never }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {canCreateRoles.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Full Name *</label>
                  <input type="text" placeholder="Dr. Ramesh Sharma" value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Email Address *</label>
                  <input type="email" placeholder="admin@college.edu" value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* College selector */}
                {isPlatformAdmin ? (
                  <div>
                    <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">College</label>
                    <select
                      value={form.college_id ?? ""}
                      onChange={(e) => handleCollegeChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="">Select college...</option>
                      {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">College</label>
                    <p className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-600">
                      Assigned to your college
                    </p>
                  </div>
                )}

                {/* Department selector (for dept admin role) */}
                {form.role === "department_admin" && deptOptions.length > 0 && (
                  <div>
                    <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Department</label>
                    <select
                      value={form.department_id ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, department_id: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="">Select department...</option>
                      {deptOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-5 pt-0 flex gap-2.5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Admin
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
