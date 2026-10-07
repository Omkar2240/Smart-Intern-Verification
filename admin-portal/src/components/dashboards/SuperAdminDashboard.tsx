"use client";

import React from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import {
  Building2, Users, ShieldCheck, AlertTriangle, Briefcase,
  Clock, ChevronRight, TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import type { AnalyticsSummary, AttendanceAnalytics } from "@/types/admin";

interface Props {
  analytics: AnalyticsSummary | null;
  attendanceAnalytics: AttendanceAnalytics | null;
}

const CHART_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

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
        <p key={i} style={{ color: p.color ?? "#0ea5e9" }} className="font-mono font-semibold">
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

export function SuperAdminDashboard({ analytics, attendanceAnalytics }: Props) {
  const stats = analytics;

  // Build pie data from real analytics
  const verificationPieData = stats
    ? [
        { name: "Verified", value: stats.verified_users, color: "#10b981" },
        { name: "Pending Review", value: stats.pending_reviews, color: "#f59e0b" },
        { name: "Rejected", value: stats.rejected_verifications, color: "#ef4444" },
      ]
    : [];

  const internshipPieData = stats?.total_internships
    ? [
        { name: "Verified", value: stats.verified_internships ?? 0, color: "#0ea5e9" },
        { name: "Pending", value: stats.pending_internships ?? 0, color: "#f59e0b" },
        { name: "Other", value: (stats.total_internships ?? 0) - (stats.verified_internships ?? 0) - (stats.pending_internships ?? 0), color: "#94a3b8" },
      ]
    : [];

  const monthlyTrend = attendanceAnalytics?.monthly_trend ?? [];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { title: "Colleges", value: stats?.active_colleges ?? "—", icon: Building2, color: "indigo" as const, subtitle: "Whitelisted" },
          { title: "Total Students", value: stats?.total_users?.toLocaleString() ?? "—", icon: Users, color: "cyan" as const, subtitle: "All enrolled" },
          { title: "Active Interns", value: stats?.total_internships?.toLocaleString() ?? "—", icon: Briefcase, color: "emerald" as const, subtitle: "On internship" },
          { title: "Pending Reviews", value: stats?.pending_reviews ?? "—", icon: Clock, color: "amber" as const, badge: (stats?.pending_reviews ?? 0) > 0 ? "Queue" : undefined, subtitle: "Awaiting" },
          { title: "Flagged Cases", value: stats?.rejected_verifications ?? "—", icon: AlertTriangle, color: "rose" as const, subtitle: "Needs action" },
          { title: "Verified", value: stats?.verified_users?.toLocaleString() ?? "—", icon: ShieldCheck, color: "emerald" as const, subtitle: "3-tier cleared" },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...stat} animate={false} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Verification Results Pie */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-0.5">Verification Breakdown</h3>
          <p className="text-[11px] text-slate-400 font-mono mb-3">All-time identity results</p>
          {verificationPieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={verificationPieData} innerRadius={35} outerRadius={52} paddingAngle={3} dataKey="value">
                    {verificationPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {verificationPieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-slate-600 flex-1">{d.name}</span>
                    <span className="font-mono font-bold text-slate-900">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center">
              <p className="text-[11px] text-slate-400 font-mono">No data yet</p>
            </div>
          )}
        </motion.div>

        {/* Internship Pie */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-0.5">Internship Status</h3>
          <p className="text-[11px] text-slate-400 font-mono mb-3">All submissions</p>
          {internshipPieData.filter((d) => d.value > 0).length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={internshipPieData} innerRadius={35} outerRadius={52} paddingAngle={3} dataKey="value">
                    {internshipPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {internshipPieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-slate-600 flex-1">{d.name}</span>
                    <span className="font-mono font-bold text-slate-900">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center">
              <p className="text-[11px] text-slate-400 font-mono">No data yet</p>
            </div>
          )}
        </motion.div>

        {/* Attendance Trend */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Trend</h3>
              <p className="text-[11px] text-slate-400 font-mono">Platform-wide monthly avg</p>
            </div>
            {attendanceAnalytics && (
              <div className="flex items-center gap-1 text-emerald-600 font-mono text-[10px] font-bold">
                <TrendingUp className="w-3 h-3" />
                {attendanceAnalytics.average_attendance_rate?.toFixed(1)}%
              </div>
            )}
          </div>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashAttend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="rate" stroke="#0ea5e9" strokeWidth={2} fill="url(#dashAttend)" dot={{ r: 3, fill: "#0ea5e9" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[130px] flex items-center justify-center">
              <p className="text-[11px] text-slate-400 font-mono">No trend data available</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Links Row */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          { label: "Review Pending Verifications", href: "/verifications?status=manual_review", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500" },
          { label: "Manage Colleges", href: "/colleges", color: "text-sky-700 bg-sky-50 border-sky-200", dot: "bg-sky-500" },
          { label: "Audit Activity Logs", href: "/audit-logs", color: "text-slate-700 bg-slate-50 border-slate-200", dot: "bg-slate-500" },
          { label: "System Configuration", href: "/system-config", color: "text-purple-700 bg-purple-50 border-purple-200", dot: "bg-purple-500" },
        ].map(({ label, href, color, dot }) => (
          <a key={href} href={href}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-[12px] font-semibold transition-all hover:shadow-sm group ${color}`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              {label}
            </div>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        ))}
      </motion.div>
    </div>
  );
}
