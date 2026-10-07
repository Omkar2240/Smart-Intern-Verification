"use client";

import React from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import {
  Users, ShieldCheck, AlertTriangle, Briefcase,
  Clock, TrendingUp, ChevronRight,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { VerificationStatusBadge } from "@/components/StatusBadges";
import type { AnalyticsSummary, Student, AttendanceAnalytics } from "@/types/admin";
import { clsx } from "clsx";

interface Props {
  analytics: AnalyticsSummary | null;
  recentStudents: Student[];
  attendanceAnalytics: AttendanceAnalytics | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-slate-900 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? "#10b981" }} className="font-mono font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function DeptAdminDashboard({ analytics, recentStudents, attendanceAnalytics }: Props) {
  const stats = analytics;

  const presentPct = attendanceAnalytics
    ? Math.round((attendanceAnalytics.present_today / Math.max(1, attendanceAnalytics.present_today + attendanceAnalytics.absent_today + attendanceAnalytics.late_today)) * 100)
    : 87;

  const attendancePie = [
    { name: "Present", value: attendanceAnalytics?.present_today ?? 87, color: "#10b981" },
    { name: "Late", value: attendanceAnalytics?.late_today ?? 9, color: "#f59e0b" },
    { name: "Absent", value: attendanceAnalytics?.absent_today ?? 4, color: "#ef4444" },
  ];

  const monthlyTrend = attendanceAnalytics?.monthly_trend ?? [];

  const verifiedCount = recentStudents.filter((s) => s.verification_status === "verified").length;
  const pendingCount = recentStudents.filter((s) => s.verification_status === "pending" || s.verification_status === "manual_review").length;
  const activeInterns = recentStudents.filter((s) => s.internship_status === "active").length;

  return (
    <div className="space-y-6">
      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: "Dept. Students", value: stats?.total_users?.toLocaleString() ?? "—", icon: Users, color: "cyan" as const, subtitle: "My department" },
          { title: "Active Interns", value: stats?.total_internships?.toLocaleString() ?? "—", icon: Briefcase, color: "emerald" as const, subtitle: "On internship" },
          { title: "Attendance Rate", value: `${attendanceAnalytics?.average_attendance_rate?.toFixed(0) ?? "—"}%`, icon: TrendingUp, color: "indigo" as const, subtitle: "This month" },
          { title: "Pending Reviews", value: stats?.pending_reviews ?? "—", icon: Clock, color: "amber" as const, badge: (stats?.pending_reviews ?? 0) > 0 ? "Queue" : undefined, subtitle: "Awaiting" },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...stat} animate={false} />
          </motion.div>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: "Flagged Cases", value: stats?.rejected_verifications ?? "—", icon: AlertTriangle, color: "rose" as const, subtitle: "Need review" },
          { title: "Verified Profiles", value: stats?.verified_users?.toLocaleString() ?? "—", icon: ShieldCheck, color: "emerald" as const, subtitle: "ID verified" },
          { title: "Verified Internships", value: stats?.verified_internships?.toLocaleString() ?? "—", icon: Briefcase, color: "purple" as const, subtitle: "Confirmed" },
          { title: "Pending Internships", value: stats?.pending_internships?.toLocaleString() ?? "—", icon: Clock, color: "amber" as const, subtitle: "Under review" },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <StatCard {...stat} animate={false} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Donut */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-1">Attendance Today</h3>
          <p className="text-[11px] text-slate-400 font-mono mb-3">{presentPct}% Present</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={attendancePie} innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                    {attendancePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[13px] font-extrabold text-emerald-700">{presentPct}%</span>
                <span className="text-[8px] font-mono text-slate-500">Rate</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {attendancePie.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-600 flex-1">{d.name}</span>
                  <span className="font-mono font-bold text-slate-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-1">Monthly Attendance Trend</h3>
          <p className="text-[11px] text-slate-400 font-mono mb-3">Department average over time</p>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="deptAttGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} fill="url(#deptAttGrad)" dot={{ r: 3, fill: "#10b981" }} name="Rate" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[150px] flex items-center justify-center">
              <p className="text-[11px] text-slate-400 font-mono">No trend data yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Students */}
      {recentStudents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">My Students — Recent</h3>
              <p className="text-[11px] text-slate-400 font-mono">{stats?.total_users ?? "—"} total students</p>
            </div>
            <a href="/students" className="text-[11px] text-sky-600 font-semibold flex items-center gap-0.5 hover:text-sky-700">
              View All <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Student", "Reg. No.", "Verification", "Internship", "Attendance"].map((col) => (
                    <th key={col} className="py-2.5 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentStudents.slice(0, 5).map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 border border-sky-200 flex items-center justify-center text-[10px] font-bold text-sky-700 shrink-0">
                          {stu.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{stu.name}</p>
                          <p className="font-mono text-[9px] text-slate-500">{stu.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-600">{stu.registration_number}</td>
                    <td className="py-3 px-4"><VerificationStatusBadge status={stu.verification_status} /></td>
                    <td className="py-3 px-4">
                      <span className={clsx("font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize",
                        stu.internship_status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : stu.internship_status === "completed" ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      )}>
                        {stu.internship_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {stu.attendance_rate != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={clsx("h-full rounded-full",
                                stu.attendance_rate >= 85 ? "bg-emerald-500"
                                  : stu.attendance_rate >= 70 ? "bg-amber-500" : "bg-rose-500"
                              )}
                              style={{ width: `${Math.min(100, stu.attendance_rate)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-700">{stu.attendance_rate}%</span>
                        </div>
                      ) : <span className="text-slate-400 text-[10px]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
