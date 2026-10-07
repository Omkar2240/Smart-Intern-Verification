"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Search, CheckCircle2, Clock, XCircle, AlertTriangle, Briefcase,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { PaginationBar } from "@/components/PaginationBar";
import { TableSkeleton, ErrorBanner, EmptyState } from "@/components/UiStates";
import { VerificationStatusBadge } from "@/components/StatusBadges";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { StudentListResponse, College } from "@/types/admin";
import { clsx } from "clsx";

interface Props {
  initialData: StudentListResponse | null;
  colleges: College[];
}

const INTERNSHIP_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  not_started: "bg-slate-50 text-slate-500 border-slate-200",
};

export function StudentsClient({ initialData, colleges }: Props) {
  const { user } = useAdminAuth();
  const role = user?.role ?? "department_admin";
  const isPlatformAdmin = role === "super_admin" || role === "admin";

  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [internshipFilter, setInternshipFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 350);

  const { data, loading, error, refetch } = useApi(
    () => api.getStudents({
      search: debouncedSearch || undefined,
      verification_status: verificationFilter === "all" ? undefined : (verificationFilter as never),
      internship_status: internshipFilter === "all" ? undefined : internshipFilter,
      college_id: collegeFilter || undefined,
      page, page_size: 20,
    }),
    [debouncedSearch, verificationFilter, internshipFilter, collegeFilter, page],
  );

  const items = data?.items ?? initialData?.items ?? [];
  const total = data?.total ?? initialData?.total ?? 0;

  const verified = items.filter((s) => s.verification_status === "verified").length;
  const pending = items.filter((s) => s.verification_status === "pending" || s.verification_status === "manual_review").length;
  const activeInterns = items.filter((s) => s.internship_status === "active").length;

  const resetFilters = () => {
    setSearch(""); setVerificationFilter("all");
    setInternshipFilter("all"); setCollegeFilter(""); setPage(1);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Student Directory"
          description={
            isPlatformAdmin ? "All registered students platform-wide"
              : role === "college_admin" ? "Students in your college"
              : "Students in your department"
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Total Students", value: total, icon: Users, color: "cyan" as const },
              { title: "Verified", value: verified, icon: CheckCircle2, color: "emerald" as const },
              { title: "Pending / Review", value: pending, icon: AlertTriangle, color: "amber" as const },
              { title: "Active Interns", value: activeInterns, icon: Briefcase, color: "indigo" as const },
            ].map((stat, i) => (
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
                <div className="p-1.5 rounded-lg bg-cyan-50 border border-cyan-200"><Users className="w-4 h-4 text-cyan-600" /></div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Student Records</h3>
                  <p className="font-mono text-[10px] text-slate-500">{total.toLocaleString()} students</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" placeholder="Name, email, reg. no..." value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-48 transition-all"
                  />
                </div>
                <select value={verificationFilter} onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Verifications</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="manual_review">Needs Review</option>
                  <option value="rejected">Rejected</option>
                  <option value="not_started">Not Started</option>
                </select>
                <select value={internshipFilter} onChange={(e) => { setInternshipFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Internships</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="not_started">Not Started</option>
                </select>
                {isPlatformAdmin && colleges.length > 0 && (
                  <select value={collegeFilter} onChange={(e) => { setCollegeFilter(e.target.value); setPage(1); }}
                    className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="">All Colleges</option>
                    {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                    {["Student", "Reg. No.", "College", "Department", "Verification", "Internship", "Attendance"].map((col) => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={7}><TableSkeleton rows={8} cols={7} /></td></tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState icon={Users} title="No students found"
                          description={
                            <button onClick={resetFilters} className="text-sky-600 underline">Clear filters</button> as never
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    items.map((student, idx) => (
                      <motion.tr key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-100 border border-sky-200 font-bold text-[11px] text-sky-700 flex items-center justify-center shrink-0">
                              {student.name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{student.name}</p>
                              <p className="font-mono text-[10px] text-slate-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600">{student.registration_number}</td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-700">{student.college_name ?? "—"}</td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-700">{student.department_name ?? "—"}</td>
                        <td className="py-3.5 px-4"><VerificationStatusBadge status={student.verification_status} /></td>
                        <td className="py-3.5 px-4">
                          <span className={clsx("inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border",
                            INTERNSHIP_STATUS_COLORS[student.internship_status] ?? "bg-slate-50 text-slate-500 border-slate-200"
                          )}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {student.internship_status === "not_started" ? "Not Started"
                              : student.internship_status === "active" ? "Active" : "Completed"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {student.attendance_rate != null ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-16">
                                <div
                                  className={clsx("h-full rounded-full", student.attendance_rate >= 75 ? "bg-emerald-500" : "bg-amber-500")}
                                  style={{ width: `${Math.min(100, student.attendance_rate)}%` }}
                                />
                              </div>
                              <span className="font-mono text-[10px] text-slate-600">{student.attendance_rate}%</span>
                            </div>
                          ) : <span className="text-slate-400 text-[10px]">—</span>}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar page={page} pageSize={20} total={total} onPageChange={setPage} />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
