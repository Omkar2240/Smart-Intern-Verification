"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Search, Filter, RefreshCw, Eye, ShieldCheck,
  RotateCcw, CheckCircle2, XCircle, Clock, ChevronDown
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { mockStudents, MockStudent } from "@/data/mock/students.mock";
import { clsx } from "clsx";

function StatusBadge({ status }: { status: MockStudent["verification_status"] }) {
  const configs: Record<string, { label: string; cls: string }> = {
    verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    manual_review: { label: "Review", cls: "bg-orange-50 text-orange-700 border-orange-200 animate-pulse" },
    rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200" },
    not_started: { label: "Not Started", cls: "bg-slate-50 text-slate-600 border-slate-200" },
  };
  const cfg = configs[status] || configs.not_started;
  return (
    <span className={clsx("inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border", cfg.cls)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

function InternshipBadge({ status }: { status: MockStudent["internship_status"] }) {
  const configs: Record<string, string> = {
    active: "bg-sky-50 text-sky-700 border-sky-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    not_started: "bg-slate-50 text-slate-500 border-slate-200",
  };
  return (
    <span className={clsx("font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border", configs[status])}>
      {status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

export default function StudentsPage() {
  const { user } = useAdminAuth();
  const role = user?.role || "department_admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [internshipFilter, setInternshipFilter] = useState("all");

  // Filter students based on role
  const roleStudents = useMemo(() => {
    if (role === "super_admin" || role === "admin") return mockStudents;
    if (role === "college_admin") return mockStudents.filter(s => s.college_id === "college-001");
    return mockStudents.filter(s => s.department_id === "dept-001");
  }, [role]);

  const filtered = useMemo(() => {
    return roleStudents.filter(s => {
      const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.registration_number.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.verification_status === statusFilter;
      const matchesInternship = internshipFilter === "all" || s.internship_status === internshipFilter;
      return matchesSearch && matchesStatus && matchesInternship;
    });
  }, [roleStudents, search, statusFilter, internshipFilter]);

  const verified = roleStudents.filter(s => s.verification_status === "verified").length;
  const pending = roleStudents.filter(s => s.verification_status === "pending" || s.verification_status === "manual_review").length;
  const rejected = roleStudents.filter(s => s.verification_status === "rejected").length;

  const headerTitle = role === "super_admin" ? "Student Directory" :
    role === "college_admin" ? "College Student Directory" : "Department Students";

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={headerTitle} description={role === "super_admin" ? "All students across all colleges" : role === "college_admin" ? "Students in your college" : "Students in your department only"} />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Total Students", value: roleStudents.length, icon: Users, color: "cyan" as const },
              { title: "Verified", value: verified, icon: CheckCircle2, color: "emerald" as const },
              { title: "Pending / Review", value: pending, icon: Clock, color: "amber" as const, badge: pending > 0 ? "Active" : undefined },
              { title: "Rejected", value: rejected, icon: XCircle, color: "rose" as const },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
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
                <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Student Records</h3>
                  <p className="font-mono text-[10px] text-slate-500">{filtered.length} of {roleStudents.length} students</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 w-52 transition-all"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="manual_review">Needs Review</option>
                  <option value="rejected">Rejected</option>
                  <option value="not_started">Not Started</option>
                </select>

                <select
                  value={internshipFilter}
                  onChange={e => setInternshipFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="all">All Internships</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="not_started">Not Started</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {["Student", "Registration", "College / Dept.", "Verification", "Internship", "Attendance", "Actions"].map(col => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-500">
                        <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold">No students found</p>
                        <p className="text-xs text-slate-400">Try adjusting filters</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((stu, idx) => (
                      <motion.tr
                        key={stu.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-100 border border-sky-200 flex items-center justify-center font-bold text-[11px] text-sky-700 shrink-0">
                              {stu.name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">{stu.name}</p>
                              <p className="font-mono text-[10px] text-slate-500">{stu.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600">{stu.registration_number}</td>
                        <td className="py-3.5 px-4">
                          <p className="text-[11px] font-medium text-slate-700 leading-tight">{stu.college_name.split(" ").slice(0, 3).join(" ")}...</p>
                          <p className="font-mono text-[10px] text-slate-400">{stu.department_name.replace("Computer Science & Engineering", "CSE").replace("Information Technology", "IT")}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={stu.verification_status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <InternshipBadge status={stu.internship_status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 w-24">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={clsx("h-full rounded-full", stu.attendance_rate >= 85 ? "bg-emerald-500" : stu.attendance_rate >= 70 ? "bg-amber-500" : "bg-rose-500")}
                                style={{ width: `${stu.attendance_rate}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] font-bold text-slate-700 shrink-0">{stu.attendance_rate}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <button className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-600 transition-all" title="View">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 transition-all" title="Force Verify">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 transition-all" title="Reset Biometrics">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/40 flex items-center justify-between">
              <p className="font-mono text-[10px] text-slate-500">
                Showing {filtered.length} of {roleStudents.length} results
              </p>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map(n => (
                  <button key={n} className={clsx("w-7 h-7 rounded-lg text-[11px] font-mono font-bold transition-all border", n === 1 ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
