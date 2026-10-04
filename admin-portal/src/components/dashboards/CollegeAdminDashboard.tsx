"use client";

import React from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";
import {
  Users, ShieldCheck, AlertTriangle, Briefcase,
  Clock, GraduationCap, ChevronRight, TrendingUp
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { mockAnalytics } from "@/data/mock/analytics.mock";
import { mockInternships } from "@/data/mock/internships.mock";

const deptStudentData = [
  { dept: "CSE", students: 126 },
  { dept: "IT", students: 118 },
  { dept: "ECE", students: 104 },
  { dept: "ME", students: 96 },
  { dept: "CE", students: 88 },
  { dept: "ET", students: 82 },
  { dept: "DS", students: 78 },
  { dept: "Others", students: 64 },
];

const internshipStatusPie = [
  { name: "Active", value: 617, color: "#0ea5e9" },
  { name: "Completed", value: 152, color: "#10b981" },
  { name: "Not Started", value: 73, color: "#94a3b8" },
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

const collegeStudents = mockInternships.filter(i => i.college_id === "college-001").slice(0, 3);

export function CollegeAdminDashboard() {
  const stats = mockAnalytics.college_admin;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: "Total Students", value: stats.total_users.toLocaleString(), icon: Users, color: "cyan" as const, subtitle: "My college" },
          { title: "Active Interns", value: "617", icon: Briefcase, color: "emerald" as const, subtitle: "On internship" },
          { title: "Departments", value: (stats as any).active_departments || 8, icon: GraduationCap, color: "indigo" as const, subtitle: "In college" },
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
          { title: "Flagged Cases", value: stats.rejected_verifications, icon: AlertTriangle, color: "rose" as const, subtitle: "Need review" },
          { title: "Verified Profiles", value: stats.verified_users.toLocaleString(), icon: ShieldCheck, color: "emerald" as const, subtitle: "ID verified" },
          { title: "Attendance Rate", value: `${(stats as any).avg_attendance_rate || 83}%`, icon: TrendingUp, color: "cyan" as const, subtitle: "This month" },
          { title: "Verified Internships", value: stats.verified_internships || 0, icon: Briefcase, color: "purple" as const, subtitle: "Confirmed" },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <StatCard {...stat} animate={false} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Students by Department - Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Students by Department</h3>
              <p className="text-[11px] text-slate-400 font-mono">G. H. Raisoni CoE</p>
            </div>
            <select className="text-[11px] font-mono border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white">
              <option>Students</option>
              <option>Interns</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={deptStudentData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dept" tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="students" fill="#0ea5e9" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Attendance Compliance Donut */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-slate-200 rounded-2xl p-5"
        >
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Attendance Compliance</h3>
            <p className="text-[11px] text-slate-400 font-mono">87% Avg. Attendance</p>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={attendancePie} innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                  {attendancePie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
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
      </div>

      {/* Bottom Row: Internship Status + Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Internship Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-slate-200 rounded-2xl p-5"
        >
          <h3 className="text-sm font-bold text-slate-900 mb-1">Internship Status (My College)</h3>
          <p className="text-[11px] text-slate-400 font-mono mb-3">842 Students</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={internshipStatusPie} innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                  {internshipStatusPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {internshipStatusPie.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-mono font-bold text-slate-900 ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Submissions Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white border border-slate-200 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Submissions</h3>
              <p className="text-[11px] text-slate-400 font-mono">My College</p>
            </div>
            <a href="/internships" className="text-[11px] text-sky-600 font-semibold flex items-center gap-0.5">
              View All <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-2">
            {mockInternships.filter(i => i.college_id === "college-001").slice(0, 3).map((int) => (
              <div key={int.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-sky-600">{int.student_name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-900">{int.student_name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{int.department_name.replace("Computer Science & Engineering", "CSE").replace("Information Technology", "IT")}</p>
                </div>
                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${
                  int.status === "verified"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : int.status === "rejected"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {int.status === "verified" ? "Verified" : int.status === "rejected" ? "Rejected" : "Under Review"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
