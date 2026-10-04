"use client";

import React from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";
import {
  Users, ShieldCheck, AlertTriangle, Briefcase,
  Clock, TrendingUp, ChevronRight
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { mockAnalytics } from "@/data/mock/analytics.mock";
import { mockStudents } from "@/data/mock/students.mock";
import { mockMonthlyAttendance } from "@/data/mock/attendance.mock";
import { clsx } from "clsx";

const studentStatusPie = [
  { name: "Active", value: 94, color: "#0ea5e9" },
  { name: "Completed", value: 22, color: "#10b981" },
  { name: "Not Started", value: 10, color: "#94a3b8" },
];

const attendancePie = [
  { name: "Present", value: 87, color: "#10b981" },
  { name: "Late", value: 9, color: "#f59e0b" },
  { name: "Absent", value: 4, color: "#ef4444" },
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

const deptStudents = mockStudents.filter((s) => s.department_id === "dept-001").slice(0, 3);

export function DeptAdminDashboard() {
  const stats = mockAnalytics.department_admin;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: "Dept. Students", value: 126, icon: Users, color: "cyan" as const, subtitle: "CSE dept." },
          { title: "Active Interns", value: 94, icon: Briefcase, color: "emerald" as const, subtitle: "On internship" },
          { title: "Attendance Rate", value: "87%", icon: TrendingUp, color: "indigo" as const, subtitle: "This month" },
          { title: "Pending Reviews", value: stats.pending_reviews, icon: Clock, color: "amber" as const, badge: "Queue", subtitle: "Awaiting" },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...stat} animate={false} />
          </motion.div>
        ))}
      </div>

      {/* Second KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: "Flagged Cases", value: 2, icon: AlertTriangle, color: "rose" as const, subtitle: "Need review" },
          { title: "Verified Profiles", value: stats.verified_users, icon: ShieldCheck, color: "emerald" as const, subtitle: "ID verified" },
          { title: "Verified Internships", value: stats.verified_internships || 0, icon: Briefcase, color: "purple" as const, subtitle: "Confirmed" },
          { title: "Pending Internships", value: stats.pending_internships || 0, icon: Clock, color: "amber" as const, subtitle: "Under review" },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <StatCard {...stat} animate={false} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Student Internship Status Donut */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200 rounded-2xl p-5"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-1">Student Internship Status (CSE)</h3>
          <p className="text-[11px] text-slate-400 font-mono mb-3">126 Students</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={studentStatusPie} innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                    {studentStatusPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[13px] font-extrabold text-slate-900">126</span>
                <span className="text-[8px] font-mono text-slate-500">Total</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {studentStatusPie.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-mono font-bold text-slate-900 ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Attendance Overview Donut */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-slate-200 rounded-2xl p-5"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-1">Attendance Overview</h3>
          <p className="text-[11px] text-slate-400 font-mono mb-3">87% Dept. Avg</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={attendancePie} innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                    {attendancePie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[13px] font-extrabold text-emerald-700">87%</span>
                <span className="text-[8px] font-mono text-slate-500">Rate</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {attendancePie.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-mono font-bold text-slate-900 ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Monthly Attendance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-slate-200 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Attendance Trend (CSE)</h3>
              <p className="text-[11px] text-slate-400 font-mono">Last 6 Months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={mockMonthlyAttendance.department_admin}>
              <defs>
                <linearGradient id="deptAttGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis domain={[78, 95]} tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} fill="url(#deptAttGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activity Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white border border-slate-200 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">My Students — Recent Activity</h3>
            <p className="text-[11px] text-slate-400 font-mono">CSE Dept. • G.H. Raisoni CoE</p>
          </div>
          <a href="/students" className="text-[11px] text-sky-600 font-semibold flex items-center gap-0.5 hover:text-sky-700">
            View All <ChevronRight className="w-3 h-3" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Student", "Internship Company", "Attendance", "Status"].map((col) => (
                  <th key={col} className="py-2.5 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockStudents.filter(s => s.department_id === "dept-001").slice(0, 4).map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 border border-sky-200 flex items-center justify-center text-[10px] font-bold text-sky-700">
                        {stu.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{stu.name}</p>
                        <p className="font-mono text-[10px] text-slate-500">{stu.registration_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {stu.internship_status !== "not_started" ? "TCS" : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={clsx("h-full rounded-full", stu.attendance_rate >= 85 ? "bg-emerald-500" : stu.attendance_rate >= 70 ? "bg-amber-500" : "bg-rose-500")}
                          style={{ width: `${stu.attendance_rate}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-700">{stu.attendance_rate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={clsx("font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border", {
                      "bg-emerald-50 text-emerald-700 border-emerald-200": stu.verification_status === "verified",
                      "bg-amber-50 text-amber-700 border-amber-200": stu.verification_status === "pending" || stu.verification_status === "manual_review",
                      "bg-rose-50 text-rose-700 border-rose-200": stu.verification_status === "rejected",
                      "bg-slate-50 text-slate-600 border-slate-200": stu.verification_status === "not_started",
                    })}>
                      {stu.verification_status === "verified" ? "Verified" : stu.verification_status === "manual_review" ? "Review" : stu.verification_status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
