"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Search, Plus, Edit, Power, Users,
  Briefcase, CheckCircle2, XCircle
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { mockDepartments } from "@/data/mock/departments.mock";
import { clsx } from "clsx";

export default function DepartmentsPage() {
  const { user } = useAdminAuth();
  const role = user?.role || "college_admin";

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", code: "", hod_name: "", hod_email: "" });

  const roleDepts = useMemo(() => {
    if (role === "super_admin" || role === "admin") return mockDepartments;
    return mockDepartments.filter(d => d.college_id === "college-001");
  }, [role]);

  const filtered = useMemo(() =>
    roleDepts.filter(d =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code?.toLowerCase().includes(search.toLowerCase()) ||
      d.hod_name?.toLowerCase().includes(search.toLowerCase())
    ), [roleDepts, search]);

  const active = roleDepts.filter(d => d.is_active).length;
  const totalStudents = roleDepts.reduce((a, d) => a + d.student_count, 0);
  const totalInterns = roleDepts.reduce((a, d) => a + d.active_internships, 0);

  const deptColors = [
    "from-sky-50 to-blue-100 border-sky-200 text-sky-700",
    "from-purple-50 to-indigo-100 border-purple-200 text-purple-700",
    "from-emerald-50 to-teal-100 border-emerald-200 text-emerald-700",
    "from-amber-50 to-orange-100 border-amber-200 text-amber-700",
    "from-rose-50 to-pink-100 border-rose-200 text-rose-700",
    "from-violet-50 to-purple-100 border-violet-200 text-violet-700",
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Departments"
          description={role === "super_admin" ? "All departments across colleges" : "Departments in your college"}
          actions={
            role !== "department_admin" ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-sm shadow-sky-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Department
              </button>
            ) : null
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Total Departments", value: roleDepts.length, icon: GraduationCap, color: "purple" as const },
              { title: "Active", value: active, icon: CheckCircle2, color: "emerald" as const },
              { title: "Total Students", value: totalStudents, icon: Users, color: "cyan" as const },
              { title: "Active Interns", value: totalInterns, icon: Briefcase, color: "indigo" as const },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Search */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search departments..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
              />
            </div>
          </motion.div>

          {/* Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((dept, idx) => {
              const colorCls = deptColors[idx % deptColors.length];
              return (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.06 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-sky-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={clsx("w-10 h-10 rounded-xl border flex items-center justify-center font-extrabold text-xs bg-gradient-to-br shrink-0 group-hover:scale-105 transition-transform", colorCls)}>
                      {dept.code?.slice(0, 3) || "DEPT"}
                    </div>
                    <span className={clsx(
                      "font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border",
                      dept.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                    )}>
                      {dept.is_active ? "● Active" : "● Inactive"}
                    </span>
                  </div>

                  <h3 className="text-[13px] font-bold text-slate-900 mb-0.5 group-hover:text-sky-700 transition-colors leading-snug">
                    {dept.name}
                  </h3>
                  <p className="font-mono text-[10px] text-slate-400 mb-3">
                    {dept.college_name?.split(" ").slice(0, 4).join(" ")}...
                  </p>

                  {dept.hod_name && (
                    <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                      <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                        {dept.hod_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-900 truncate">{dept.hod_name}</p>
                        <p className="font-mono text-[9px] text-slate-500 truncate">HOD · {dept.hod_email}</p>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[16px] font-extrabold text-slate-900">{dept.student_count}</p>
                      <p className="font-mono text-[9px] text-slate-400 uppercase">Students</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[16px] font-extrabold text-emerald-700">{dept.active_internships}</p>
                      <p className="font-mono text-[9px] text-slate-400 uppercase">Interns</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {role !== "department_admin" && (
                    <div className="flex items-center gap-2">
                      <button className="flex-1 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-bold transition-all">
                        View
                      </button>
                      <button className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button className={clsx("p-1.5 rounded-xl border transition-all",
                        dept.is_active ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600" : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600"
                      )}>
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Add New Department</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              {[
                { label: "Department Name", key: "name", placeholder: "Computer Science & Engineering" },
                { label: "Short Code", key: "code", placeholder: "CSE" },
                { label: "HOD Name", key: "hod_name", placeholder: "Dr. Ramesh Sharma" },
                { label: "HOD Email", key: "hod_email", placeholder: "ramesh.sharma@college.edu" },
              ].map(field => (
                <div key={field.key}>
                  <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={newDept[field.key as keyof typeof newDept]}
                    onChange={e => setNewDept(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="p-5 pt-0 flex gap-2.5">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold transition-all shadow-sm">Create Department</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
