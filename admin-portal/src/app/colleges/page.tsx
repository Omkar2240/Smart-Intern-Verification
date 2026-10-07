"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Building2, Search, Plus, Eye, Edit, Power,
  Users, GraduationCap, CheckCircle2, XCircle, MapPin
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { mockColleges } from "@/data/mock/colleges.mock";
import { clsx } from "clsx";

const enrichedColleges = mockColleges.map((c, i) => ({
  ...c,
  department_count: [8, 12, 6][i],
  student_count: [2400, 3800, 1600][i],
  active_interns: [617, 920, 340][i],
  verified_rate: [78, 82, 71][i],
}));

export default function CollegesPage() {
  const { user } = useAdminAuth();
  const role = user?.role || "super_admin";
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollege, setNewCollege] = useState({ name: "", code: "", city: "", state: "", country: "India" });

  const filtered = useMemo(() => {
    return enrichedColleges.filter(c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const active = enrichedColleges.filter(c => c.is_active).length;
  const totalStudents = enrichedColleges.reduce((a, c) => a + c.student_count, 0);
  const totalDepts = enrichedColleges.reduce((a, c) => a + c.department_count, 0);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Colleges & Rosters"
          description="Manage all affiliated colleges and student rosters"
          actions={
            role === "super_admin" || role === "admin" ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-sm shadow-sky-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add College
              </button>
            ) : null
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Total Colleges", value: enrichedColleges.length, icon: Building2, color: "indigo" as const },
              { title: "Active Colleges", value: active, icon: CheckCircle2, color: "emerald" as const },
              { title: "Total Students", value: totalStudents.toLocaleString(), icon: Users, color: "cyan" as const },
              { title: "Total Departments", value: totalDepts, icon: GraduationCap, color: "purple" as const },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search colleges..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
              />
            </div>
            <span className="font-mono text-[11px] text-slate-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </motion.div>

          {/* College Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((college, idx) => (
              <motion.div
                key={college.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.07 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-sky-200 transition-all group cursor-pointer"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-100 border border-sky-200 flex items-center justify-center text-sky-700 font-extrabold text-sm shadow-xs group-hover:scale-105 transition-transform">
                      {college.code?.slice(0, 2) || "CO"}
                    </div>
                    <span className={clsx(
                      "font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border",
                      college.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {college.is_active ? "● Active" : "● Inactive"}
                    </span>
                  </div>

                  <h3 className="text-[13px] font-bold text-slate-900 leading-snug mb-1 group-hover:text-sky-700 transition-colors">
                    {college.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin className="w-3 h-3" />
                    <span className="font-mono">{college.city}, {college.state}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
                  {[
                    { label: "Students", value: college.student_count.toLocaleString(), color: "text-sky-700" },
                    { label: "Departments", value: college.department_count, color: "text-purple-700" },
                    { label: "Interns", value: college.active_interns, color: "text-emerald-700" },
                  ].map(stat => (
                    <div key={stat.label} className="py-3 px-2">
                      <p className={clsx("text-[15px] font-extrabold tabular-nums", stat.color)}>{stat.value}</p>
                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Verification Progress */}
                <div className="px-5 pb-4 pt-2">
                  <div className="flex items-center justify-between text-[10px] mb-1.5">
                    <span className="font-mono text-slate-500">Verification Rate</span>
                    <span className="font-mono font-bold text-slate-700">{college.verified_rate}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${college.verified_rate}%` }}
                      transition={{ delay: 0.4 + idx * 0.1, duration: 0.7, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Actions */}
                {(role === "super_admin" || role === "admin") && (
                  <div className="px-5 pb-4 flex items-center gap-2">
                    <button className="flex-1 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all">
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    <button className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all" title="Edit">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button className={clsx("p-2 rounded-xl border transition-all", college.is_active ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600" : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600")} title={college.is_active ? "Deactivate" : "Activate"}>
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </main>
      </div>

      {/* Create College Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Add New College</h3>
                    <p className="font-mono text-[10px] text-slate-500">Super Admin action</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3.5">
              {[
                { label: "College Name", key: "name", placeholder: "G. H. Raisoni College of Engineering" },
                { label: "Short Code", key: "code", placeholder: "GHRCE" },
                { label: "City", key: "city", placeholder: "Nagpur" },
                { label: "State", key: "state", placeholder: "Maharashtra" },
              ].map(field => (
                <div key={field.key}>
                  <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={newCollege[field.key as keyof typeof newCollege]}
                    onChange={e => setNewCollege(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="p-5 pt-0 flex gap-2.5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                Create College
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
