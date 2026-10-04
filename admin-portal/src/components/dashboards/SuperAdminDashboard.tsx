"use client";

import React from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { motion } from "framer-motion";
import {
  Building2, Users, ShieldCheck, AlertTriangle, Briefcase,
  Clock, TrendingUp, ChevronRight, Crown, GraduationCap, Eye
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { mockColleges } from "@/data/mock/colleges.mock";
import { mockAnalytics } from "@/data/mock/analytics.mock";
import { mockFlaggedCases } from "@/data/mock/auditLogs.mock";
import { mockMonthlyAttendance } from "@/data/mock/attendance.mock";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const collegeStudentData = mockColleges.map((c, i) => ({
  name: c.code,
  students: [842, 620, 496, 355, 165][i] || 100,
}));

const internshipPieData = [
  { name: "Active", value: 1824, color: "#0ea5e9" },
  { name: "Completed", value: 412, color: "#10b981" },
  { name: "Not Started", value: 245, color: "#94a3b8" },
];

const verificationPieData = [
  { name: "Verified", value: 2218, color: "#10b981" },
  { name: "Pending", value: 169, color: "#f59e0b" },
  { name: "Flagged", value: 94, color: "#ef4444" },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-bold text-slate-900 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-mono font-semibold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SuperAdminDashboard() {
  const stats = mockAnalytics.super_admin;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { title: "Total Colleges", value: stats.active_colleges, icon: Building2, color: "indigo" as const, subtitle: "Whitelisted" },
          { title: "Total Students", value: stats.total_users.toLocaleString(), icon: Users, color: "cyan" as const, subtitle: "All enrolled" },
          { title: "Active Interns", value: "1,824", icon: Briefcase, color: "emerald" as const, subtitle: "On internship" },
          { title: "Pending Reviews", value: stats.pending_reviews, icon: Clock, color: "amber" as const, badge: "Queue", subtitle: "Awaiting" },
          { title: "Flagged Cases", value: stats.rejected_verifications, icon: AlertTriangle, color: "rose" as const, subtitle: "Needs action" },
          { title: "Verified Profiles", value: stats.verified_users.toLocaleString(), icon: ShieldCheck, color: "emerald" as const, subtitle: "3-tier cleared" },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...stat} animate={false} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Students by College - Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Students by College</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Enrollment distribution</p>
            </div>
            <select className="text-[11px] font-mono border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white">
              <option>Students</option>
              <option>Interns</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={collegeStudentData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="students" fill="#0ea5e9" radius={[6, 6, 0, 0]}>
                {collegeStudentData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Attendance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white border border-slate-200 rounded-2xl p-5"
        >
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Attendance Trend</h3>
            <p className="text-[11px] text-slate-400 font-mono">Platform-wide 6-month avg</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockMonthlyAttendance.super_admin}>
              <defs>
                <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis domain={[75, 95]} tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="rate" stroke="#0ea5e9" strokeWidth={2} fill="url(#attendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 - Pie charts + Flagged cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Internship Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200 rounded-2xl p-5"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-1">Internship Status (All)</h3>
          <p className="text-[11px] text-slate-400 font-mono mb-3">2,481 Submissions</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={internshipPieData} innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                  {internshipPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {internshipPieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-mono font-bold text-slate-900 ml-auto">{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Verification Results Pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-slate-200 rounded-2xl p-5"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-1">Verification Results</h3>
          <p className="text-[11px] text-slate-400 font-mono mb-3">2,481 Submissions</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={verificationPieData} innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                  {verificationPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {verificationPieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-mono font-bold text-slate-900 ml-auto">{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Flagged Cases Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-slate-200 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Flagged Cases</h3>
              <p className="text-[11px] text-slate-400 font-mono">Needs manual review</p>
            </div>
            <a href="/verifications" className="text-[11px] text-sky-600 font-semibold flex items-center gap-0.5 hover:text-sky-700">
              View All <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-2">
            {mockFlaggedCases.map((fc) => (
              <div key={fc.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-900">{fc.student_id}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{fc.college} · {fc.issue}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] font-bold text-rose-600">{fc.confidence}%</p>
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold ${fc.status === "Flagged" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    {fc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
