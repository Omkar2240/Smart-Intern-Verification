"use client";

import React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  Clock,
  GraduationCap,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import type {
  AnalyticsSummary,
  Department,
  AttendanceAnalytics,
} from "@/types/admin";

interface Props {
  analytics: AnalyticsSummary | null;
  departments: Department[];
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
        <p
          key={i}
          style={{ color: p.color ?? "#0ea5e9" }}
          className="font-mono font-semibold"
        >
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function CollegeAdminDashboard({
  analytics,
  departments,
  attendanceAnalytics,
}: Props) {
  const stats = analytics;

  const deptChartData = (departments || []).slice(0, 8).map((d) => ({
    dept: d.code?.slice(0, 4) ?? d.name.slice(0, 4),
    students: d.student_count,
    interns: d.active_internships,
  }));

  const presentPct = attendanceAnalytics
    ? Math.round(
        (attendanceAnalytics.present_today /
          Math.max(
            1,
            attendanceAnalytics.present_today +
              attendanceAnalytics.absent_today +
              attendanceAnalytics.late_today,
          )) *
          100,
      )
    : 87;

  const attendancePie = [
    {
      name: "Present",
      value: attendanceAnalytics?.present_today ?? 87,
      color: "#10b981",
    },
    {
      name: "Late",
      value: attendanceAnalytics?.late_today ?? 9,
      color: "#f59e0b",
    },
    {
      name: "Absent",
      value: attendanceAnalytics?.absent_today ?? 4,
      color: "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            title: "Total Students",
            value: stats?.total_users?.toLocaleString() ?? "—",
            icon: Users,
            color: "cyan" as const,
            subtitle: "My college",
          },
          {
            title: "Active Interns",
            value: stats?.total_internships?.toLocaleString() ?? "—",
            icon: Briefcase,
            color: "emerald" as const,
            subtitle: "On internship",
          },
          {
            title: "Departments",
            value: departments?.length || "—",
            icon: GraduationCap,
            color: "indigo" as const,
            subtitle: "In college",
          },
          {
            title: "Pending Reviews",
            value: stats?.pending_reviews ?? "—",
            icon: Clock,
            color: "amber" as const,
            badge: (stats?.pending_reviews ?? 0) > 0 ? "Queue" : undefined,
            subtitle: "Awaiting",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <StatCard {...stat} animate={false} />
          </motion.div>
        ))}
      </div>

      {/* Second KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            title: "Flagged Cases",
            value: stats?.rejected_verifications ?? "—",
            icon: AlertTriangle,
            color: "rose" as const,
            subtitle: "Need review",
          },
          {
            title: "Verified Profiles",
            value: stats?.verified_users?.toLocaleString() ?? "—",
            icon: ShieldCheck,
            color: "emerald" as const,
            subtitle: "ID verified",
          },
          {
            title: "Attendance Rate",
            value: `${attendanceAnalytics?.average_attendance_rate?.toFixed(0) ?? "—"}%`,
            icon: TrendingUp,
            color: "cyan" as const,
            subtitle: "This month",
          },
          {
            title: "Verified Internships",
            value: stats?.verified_internships?.toLocaleString() ?? "—",
            icon: Briefcase,
            color: "purple" as const,
            subtitle: "Confirmed",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
          >
            <StatCard {...stat} animate={false} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Students by Department */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Students by Department
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {departments?.length || 0} departments
              </p>
            </div>
          </div>
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deptChartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="dept"
                  tick={{ fontSize: 10, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="students"
                  fill="#0ea5e9"
                  radius={[5, 5, 0, 0]}
                  name="Students"
                />
                <Bar
                  dataKey="interns"
                  fill="#10b981"
                  radius={[5, 5, 0, 0]}
                  name="Interns"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-[11px] text-slate-400 font-mono">
                No department data available
              </p>
            </div>
          )}
        </motion.div>

        {/* Attendance Pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
        >
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Attendance Compliance
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {presentPct}% Avg. Attendance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie
                    data={attendancePie}
                    innerRadius={35}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {attendancePie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[13px] font-extrabold text-emerald-700">
                  {presentPct}%
                </span>
                <span className="text-[8px] font-mono text-slate-500">
                  Rate
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              {attendancePie.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: d.color }}
                  />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-mono font-bold text-slate-900 ml-auto">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {[
          {
            label: "Review Pending Verifications",
            href: "/verifications?status=manual_review",
            color: "text-amber-700 bg-amber-50 border-amber-200",
          },
          {
            label: "Manage Departments",
            href: "/departments",
            color: "text-sky-700 bg-sky-50 border-sky-200",
          },
          {
            label: "College Reports",
            href: "/audit-logs",
            color: "text-slate-700 bg-slate-50 border-slate-200",
          },
        ].map(({ label, href, color }) => (
          <a
            key={href}
            href={href}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-[12px] font-semibold transition-all hover:shadow-sm group ${color}`}
          >
            {label}
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        ))}
      </motion.div>
    </div>
  );
}
