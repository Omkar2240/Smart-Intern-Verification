"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Search, Users, TrendingUp, TrendingDown, Activity, Zap, CheckCircle, AlertTriangle, X } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { PaginationBar } from "@/components/PaginationBar";
import { TableSkeleton, ErrorBanner, EmptyState } from "@/components/UiStates";
import { AttendanceStatusBadge } from "@/components/StatusBadges";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { AttendanceListResponse, AttendanceAnalytics } from "@/types/admin";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Props {
  initialData: AttendanceListResponse | null;
  initialAnalytics: AttendanceAnalytics | null;
}

export function AttendanceClient({ initialData, initialAnalytics }: Props) {
  const { user } = useAdminAuth();
  const role = user?.role ?? "department_admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [page, setPage] = useState(1);

  // Request Live Check Modal State
  const [selectedStudentForCheck, setSelectedStudentForCheck] = useState<{ id: string; name: string } | null>(null);
  const [checkPrompt, setCheckPrompt] = useState("Urgent live attendance check requested by department administration.");
  const [requestingCheck, setRequestingCheck] = useState(false);
  const [checkSuccessMsg, setCheckSuccessMsg] = useState<string | null>(null);
  const [checkErrorMsg, setCheckErrorMsg] = useState<string | null>(null);

  const handleSendCheckRequest = async () => {
    if (!selectedStudentForCheck) return;
    setRequestingCheck(true);
    setCheckSuccessMsg(null);
    setCheckErrorMsg(null);
    try {
      const res = await api.requestAttendanceCheck(selectedStudentForCheck.id, checkPrompt.trim());
      setCheckSuccessMsg(`Live 10-minute attendance check sent to ${selectedStudentForCheck.name}! Expiry: 10 mins.`);
      setTimeout(() => {
        setSelectedStudentForCheck(null);
        setCheckSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setCheckErrorMsg(err.message || "Failed to trigger live attendance check.");
    } finally {
      setRequestingCheck(false);
    }
  };

  const debouncedSearch = useDebounce(search, 350);

  const { data, loading, error, refetch } = useApi(
    () => api.getAttendance({
      search: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : (statusFilter as never),
      date_filter: dateFilter as "today" | "week" | "month",
      page, page_size: 20,
    }),
    [debouncedSearch, statusFilter, dateFilter, page],
  );

  const items = data?.items ?? initialData?.items ?? [];
  const total = data?.total ?? initialData?.total ?? 0;
  const analytics = initialAnalytics;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Attendance Monitoring"
          description={
            role === "super_admin" || role === "admin" ? "Platform-wide attendance overview"
              : role === "college_admin" ? "College attendance — live"
              : "Department attendance — live"
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Present Today", value: analytics?.present_today ?? 0, icon: Users, color: "emerald" as const },
              { title: "Absent Today", value: analytics?.absent_today ?? 0, icon: Users, color: "rose" as const },
              { title: "Late Today", value: analytics?.late_today ?? 0, icon: Clock, color: "amber" as const },
              { title: "Avg. Rate", value: `${analytics?.average_attendance_rate?.toFixed(1) ?? 0}%`, icon: Activity, color: "cyan" as const },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Trend Chart */}
          {analytics?.monthly_trend && analytics.monthly_trend.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Attendance Trend</h3>
                  <p className="font-mono text-[10px] text-slate-500">Monthly attendance rate</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-mono text-[10px] font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {analytics.average_attendance_rate.toFixed(1)}% avg
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={analytics.monthly_trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: "var(--font-mono)" }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 9, fontFamily: "var(--font-mono)" }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e2e8f0", fontFamily: "var(--font-mono)" }}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#0ea5e9" strokeWidth={2} fill="url(#attendGrad)" dot={{ r: 3, fill: "#0ea5e9" }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Table Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
          >
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200"><Clock className="w-4 h-4 text-emerald-600" /></div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Attendance Records</h3>
                  <p className="font-mono text-[10px] text-slate-500">{total.toLocaleString()} entries</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search student..." value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-44 transition-all"
                  />
                </div>
                <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
            </div>

            {error && <ErrorBanner message={error} onRetry={refetch} />}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {["Student", "Department", "Date", "Check In", "Check Out", "Status", "Rate", "Action"].map((col) => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={7}><TableSkeleton rows={8} cols={7} /></td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState icon={Clock} title="No attendance records" description="No records found for the selected period." /></td></tr>
                  ) : (
                    items.map((record, idx) => (
                      <motion.tr key={record.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900">{record.student_name}</p>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-600">{record.department_name ?? "—"}</td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600">{record.date}</td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600">{record.check_in ?? "—"}</td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600">{record.check_out ?? "—"}</td>
                        <td className="py-3.5 px-4"><AttendanceStatusBadge status={record.status} /></td>
                        <td className="py-3.5 px-4">
                          {record.attendance_rate != null ? (
                            <span className="font-mono text-[10px] font-bold text-slate-700">{record.attendance_rate}%</span>
                          ) : "—"}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedStudentForCheck({ id: record.student_id, name: record.student_name });
                              setCheckPrompt("Urgent live attendance check requested by department administration.");
                              setCheckSuccessMsg(null);
                              setCheckErrorMsg(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Zap className="w-3 h-3 text-amber-600" />
                            Live Check
                          </button>
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Request Live Attendance Check Modal                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedStudentForCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200">
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Request Live Check</h3>
              </div>
              <button
                onClick={() => setSelectedStudentForCheck(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600">
                Dispatch an on-demand 10-minute compliance challenge to{" "}
                <span className="font-bold text-slate-900">{selectedStudentForCheck.name}</span>.
                The student must respond via mobile app before the 10-minute countdown expires.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Challenge Prompt / Question
                </label>
                <textarea
                  rows={3}
                  value={checkPrompt}
                  onChange={(e) => setCheckPrompt(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-slate-900"
                  placeholder="e.g. Verify current workstation presence and summarize today's milestone..."
                />
              </div>

              {checkSuccessMsg && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{checkSuccessMsg}</span>
                </div>
              )}

              {checkErrorMsg && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{checkErrorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForCheck(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendCheckRequest}
                  disabled={requestingCheck}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {requestingCheck ? "Dispatching..." : "Send Live Challenge"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
