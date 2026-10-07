"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Search,
  Plus,
  Power,
  Edit,
  Crown,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Building2,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { mockAdminUsers } from "@/data/mock/adminUsers.mock";
import {
  ROLE_LABELS,
  ROLE_COLORS,
  CAN_CREATE_ROLES,
} from "@/constants/roles.constants";
import { clsx } from "clsx";

const roleIconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  super_admin: Crown,
  college_admin: Award,
  department_admin: BookOpen,
};

export default function AdminUsersPage() {
  const { user } = useAdminAuth();
  const role = user?.role || "college_admin";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "department_admin",
    college_id: "college-001",
    department_id: "",
  });

  const canCreateRoles = CAN_CREATE_ROLES[role] || [];

  // Role-based filtering of admins list
  const roleAdmins = useMemo(() => {
    if (role === "super_admin" || role === "admin") return mockAdminUsers;
    // College admin sees only their dept admins
    return mockAdminUsers.filter(
      (a) => a.college_id === "college-001" && a.role === "department_admin",
    );
  }, [role]);

  const filtered = useMemo(
    () =>
      roleAdmins.filter((a) => {
        const matchSearch =
          !search ||
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || a.role === roleFilter;
        return matchSearch && matchRole;
      }),
    [roleAdmins, search, roleFilter],
  );

  const active = roleAdmins.filter((a) => a.is_active).length;
  const superAdmins = roleAdmins.filter((a) => a.role === "super_admin").length;
  const collegeAdmins = roleAdmins.filter(
    (a) => a.role === "college_admin",
  ).length;
  const deptAdmins = roleAdmins.filter(
    (a) => a.role === "department_admin",
  ).length;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Admin Users"
          description={
            role === "super_admin"
              ? "All admin accounts across the platform"
              : "Department admins in your college"
          }
          actions={
            canCreateRoles.length > 0 ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Admin
              </button>
            ) : null
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(() => {
              const stats =
                role === "super_admin" || role === "admin"
                  ? [
                      {
                        title: "Total Admins",
                        value: roleAdmins.length,
                        icon: Shield,
                        color: "purple" as const,
                      },
                      {
                        title: "Super Admins",
                        value: superAdmins,
                        icon: Crown,
                        color: "violet" as const,
                      },
                      {
                        title: "College Admins",
                        value: collegeAdmins,
                        icon: Award,
                        color: "cyan" as const,
                      },
                      {
                        title: "Dept. Admins",
                        value: deptAdmins,
                        icon: BookOpen,
                        color: "emerald" as const,
                      },
                    ]
                  : [
                      {
                        title: "Dept. Admins",
                        value: roleAdmins.length,
                        icon: Shield,
                        color: "emerald" as const,
                      },
                      {
                        title: "Active",
                        value: active,
                        icon: CheckCircle2,
                        color: "emerald" as const,
                      },
                      {
                        title: "Inactive",
                        value: roleAdmins.length - active,
                        icon: XCircle,
                        color: "rose" as const,
                      },
                      {
                        title: "Can Create",
                        value: canCreateRoles.length,
                        icon: Plus,
                        color: "cyan" as const,
                      },
                    ];
              return stats.map((stat, i) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <StatCard {...stat} animate={false} />
                </motion.div>
              ));
            })()}
          </div>

          {/* Table Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
          >
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-600">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">
                    Admin Accounts
                  </h3>
                  <p className="font-mono text-[10px] text-slate-500">
                    {filtered.length} records
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search admins..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-48 transition-all"
                  />
                </div>
                {(role === "super_admin" || role === "admin") && (
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="college_admin">College Admin</option>
                    <option value="department_admin">Dept. Admin</option>
                  </select>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {[
                      "Admin",
                      "Role",
                      "College / Dept.",
                      "Last Login",
                      "Status",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-16 text-center text-slate-500"
                      >
                        <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold">No admins found</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((admin, idx) => {
                      const roleColor = ROLE_COLORS[admin.role];
                      const RoleIcon = roleIconMap[admin.role] || Shield;
                      return (
                        <motion.tr
                          key={admin.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.04 }}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={clsx(
                                  "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[11px] border shrink-0",
                                  roleColor?.bg,
                                  roleColor?.border,
                                  roleColor?.text,
                                )}
                              >
                                {admin.name?.[0]?.toUpperCase() || "A"}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
                                  {admin.name}
                                </p>
                                <p className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5" />
                                  {admin.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={clsx(
                                "flex items-center gap-1.5 w-fit font-mono text-[9px] font-bold px-2 py-1 rounded-full border",
                                roleColor?.bg,
                                roleColor?.border,
                                roleColor?.text,
                              )}
                            >
                              <RoleIcon className="w-2.5 h-2.5" />
                              {ROLE_LABELS[admin.role] || admin.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="text-[11px] font-medium text-slate-700">
                              {admin.college_name || "—"}
                            </p>
                            <p className="font-mono text-[10px] text-slate-400">
                              {admin.department_name || "All Departments"}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600">
                            {admin.last_login
                              ? new Date(admin.last_login).toLocaleDateString(
                                  "en-IN",
                                )
                              : "Never"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={clsx(
                                "font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1",
                                admin.is_active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200",
                              )}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {admin.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <button
                                className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-600 transition-all"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                className={clsx(
                                  "p-1.5 rounded-lg border transition-all",
                                  admin.is_active
                                    ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
                                    : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600",
                                )}
                                title={
                                  admin.is_active ? "Deactivate" : "Activate"
                                }
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Create Admin Account
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              {[
                {
                  label: "Full Name",
                  key: "name",
                  type: "text",
                  placeholder: "Dr. Ramesh Sharma",
                },
                {
                  label: "Email Address",
                  key: "email",
                  type: "email",
                  placeholder: "admin@college.edu",
                },
              ].map((field) => (
                <div key={field.key}>
                  <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={newAdmin[field.key as keyof typeof newAdmin]}
                    onChange={(e) =>
                      setNewAdmin((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
                  />
                </div>
              ))}

              <div>
                <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Role
                </label>
                <select
                  value={newAdmin.role}
                  onChange={(e) =>
                    setNewAdmin((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  {canCreateRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r] || r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-[10px] text-amber-700 font-mono">
                  ⚠ A temporary password will be sent to the admin's email upon
                  creation.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-2.5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold transition-all shadow-sm"
              >
                Create Admin
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
