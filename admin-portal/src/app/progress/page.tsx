"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, TrendingDown, Target,
  Users, Briefcase, CheckCircle2, Clock
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { clsx } from "clsx";

const monthlyProgress = [
  { month: "Jan", verified: 45, pending: 12, rejected: 3 },
  { month: "Feb", verified: 52, pending: 10, rejected: 2 },
  { month: "Mar", verified: 61, pending: 14, rejected: 4 },
  { month: "Apr", verified: 55, pending: 9, rejected: 2 },
  { month: "May", verified: 73, pending: 11, rejected: 3 },
  { month: "Jun", verified: 80, pending: 8, rejected: 2 },
];

const completionByDept = [
  { dept: "CSE", rate: 87, target: 90 },
  { dept: "IT", rate: 82, target: 85 },
  { dept: "ECE", rate: 75, target: 80 },
  { dept: "ME", rate: 68, target: 75 },
  { dept: "CE", rate: 71, target: 75 },
];

const radarData = [
  { subject: "Verification", A: 87, fullMark: 100 },
  { subject: "Attendance", A: 83, fullMark: 100 },
  { subject: "Internship", A: 74, fullMark: 100 },
  { subject: "Completion", A: 68, fullMark: 100 },
  { subject: "Compliance", A: 91, fullMark: 100 },
  { subject: "Reporting", A: 79, fullMark: 100 },
];

const milestones = [
  { name: "Profile Verified", completed: 320, total: 420, color: "bg-emerald-500" },
  { name: "Internship Submitted", completed: 285, total: 320, color: "bg-sky-500" },
  { name: "Internship Verified", completed: 210, total: 285, color: "bg-indigo-500" },
  { name: "Attendance 80%+", completed: 296, total: 420, color: "bg-amber-500" },
  { name: "Final Completion", completed: 180, total: 420, color: "bg-purple-500" },
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
          <p key={i} style={{ color: p.color }} className="font-mono font-semibold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProgressPage() {
  const { user } = useAdminAuth();
  const role = user?.role || "department_admin";

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Progress Tracking"
          description={role === "department_admin" ? "CSE Department — Internship & verification progress" : "Overall platform progress metrics"}
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Total Tracked", value: 420, icon: Users, color: "cyan" as const },
              { title: "Fully Completed", value: 180, icon: CheckCircle2, color: "emerald" as const, subtitle: "43% completion" },
              { title: "In Progress", value: 196, icon: Clock, color: "amber" as const },
              { title: "Verified Interns", value: 210, icon: Briefcase, color: "indigo" as const },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Monthly Verification Progress */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5"
            >
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Monthly Verification Progress</h3>
                <p className="font-mono text-[11px] text-slate-400">Verified / Pending / Rejected trends</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                  <Line type="monotone" dataKey="verified" name="Verified" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} />
                  <Line type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: "#f59e0b" }} />
                  <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border border-slate-200 rounded-2xl p-5"
            >
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-900">Performance Radar</h3>
                <p className="font-mono text-[11px] text-slate-400">Multi-dimensional score</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontFamily: "monospace", fill: "#64748b" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="Score" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Completion by Dept */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-slate-200 rounded-2xl p-5"
          >
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Completion Rate by Department</h3>
              <p className="font-mono text-[11px] text-slate-400">Actual vs Target</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={completionByDept} barSize={24} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dept" tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                <Bar dataKey="rate" name="Actual Rate" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Milestone Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white border border-slate-200 rounded-2xl p-5"
          >
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Milestone Funnel</h3>
              <p className="font-mono text-[11px] text-slate-400">Student progress pipeline</p>
            </div>
            <div className="space-y-4">
              {milestones.map((m, idx) => {
                const pct = Math.round((m.completed / m.total) * 100);
                return (
                  <div key={m.name}>
                    <div className="flex items-center justify-between text-[12px] mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={clsx("w-2.5 h-2.5 rounded-full", m.color)} />
                        <span className="font-semibold text-slate-800">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500 text-[11px]">{m.completed}/{m.total}</span>
                        <span className="font-bold text-slate-900">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4 + idx * 0.08, duration: 0.7, ease: "easeOut" }}
                        className={clsx("h-full rounded-full", m.color)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
