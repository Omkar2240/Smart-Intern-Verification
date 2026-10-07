"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock, Search, CheckCircle2, XCircle, BarChart3,
  TrendingUp, TrendingDown, Download
} from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { mockAttendanceRecords, mockDeptAttendance, mockMonthlyAttendance } from "@/data/mock/attendance.mock";
import { clsx } from "clsx";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-bold text-slate-900 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-mono font-semibold" style={{ color: p.color || "#0ea5e9" }}>
            {p.name}: {p.value}{typeof p.value === "number" && p.name.includes("rate") ? "%" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AttendancePage() {
  const { user } = useAdminAuth();
  const role = user?.role || "department_admin";
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("today");

  const records = useMemo(() => {
    const base = role === "department_admin"
      ? mockAttendanceRecords.filter(r => r.department_id === "dept-001")
      : mockAttendanceRecords;

    return base.filter(r => !search ||
      r.student_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [role, search]);

  const present = records.filter(r => r.status === "present").length;
  const absent = records.filter(r => r.status === "absent").length;
  const late = records.filter(r => r.status === "late").length;
  const avgRate = records.length > 0 ? Math.round(records.reduce((a, r) => a + r.attendance_rate, 0) / records.length) : 0;

  const monthlyData = mockMonthlyAttendance[role as keyof typeof mockMonthlyAttendance] || mockMonthlyAttendance.department_admin;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Attendance Monitoring"
          description={role === "department_admin" ? "CSE Department — Real-time attendance tracking" : "Platform-wide attendance audit"}
          actions={
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Avg. Attendance", value: `${avgRate}%`, icon: BarChart3, color: "indigo" as const, subtitle: "This month" },
              { title: "Present Today", value: present, icon: CheckCircle2, color: "emerald" as const },
              { title: "Late Today", value: late, icon: Clock, color: "amber" as const },
              { title: "Absent Today", value: absent, icon: XCircle, color: "rose" as const },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Trend */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-200 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Monthly Attendance Trend</h3>
                  <p className="font-mono text-[11px] text-slate-400">Last 6 months average (%)</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-mono text-[11px] font-bold">+2.3%</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[75, 100]} tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="rate" name="Attendance %" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#attGrad)" dot={{ r: 4, fill: "#0ea5e9", strokeWidth: 2, stroke: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Department Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border border-slate-200 rounded-2xl p-5"
            >
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Dept-wise Breakdown</h3>
                <p className="font-mono text-[11px] text-slate-400">Present / Absent / Late today</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={mockDeptAttendance} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="dept" tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Attendance Table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Today's Attendance</h3>
                  <p className="font-mono text-[10px] text-slate-500">{records.length} students tracked</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-48 transition-all"
                  />
                </div>
                <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none">
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {["Student", "Department", "Check-In", "Check-Out", "Status", "Overall Rate"].map(col => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((rec, idx) => (
                    <motion.tr
                      key={rec.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={clsx(
                            "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[11px] border shrink-0",
                            rec.status === "present" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                            rec.status === "late" ? "bg-amber-50 border-amber-200 text-amber-700" :
                            "bg-rose-50 border-rose-200 text-rose-700"
                          )}>
                            {rec.student_name[0]}
                          </div>
                          <p className="font-semibold text-slate-900">{rec.student_name}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600">CSE</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 font-semibold">{rec.check_in}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 font-semibold">{rec.check_out}</td>
                      <td className="py-3.5 px-4">
                        <span className={clsx(
                          "font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1",
                          rec.status === "present" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          rec.status === "late" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={clsx("h-full rounded-full", rec.attendance_rate >= 85 ? "bg-emerald-500" : rec.attendance_rate >= 70 ? "bg-amber-500" : "bg-rose-500")}
                              style={{ width: `${rec.attendance_rate}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-700">{rec.attendance_rate}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
