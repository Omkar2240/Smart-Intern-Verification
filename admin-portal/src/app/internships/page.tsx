"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, Search, CheckCircle2, XCircle, Clock,
  Eye, ChevronRight, Building2
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { mockInternships, MockInternship } from "@/data/mock/internships.mock";
import { clsx } from "clsx";

function StageBadge({ stage }: { stage: MockInternship["verification_stage"] }) {
  const configs: Record<string, { label: string; cls: string }> = {
    submitted: { label: "Submitted", cls: "bg-slate-50 text-slate-600 border-slate-200" },
    tp_review: { label: "TP Review", cls: "bg-sky-50 text-sky-700 border-sky-200" },
    mentor_review: { label: "Mentor Review", cls: "bg-purple-50 text-purple-700 border-purple-200" },
    verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  };
  const cfg = configs[stage] || configs.submitted;
  return (
    <span className={clsx("font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    on_site: "bg-indigo-50 text-indigo-700 border-indigo-200",
    remote: "bg-teal-50 text-teal-700 border-teal-200",
    hybrid: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={clsx("font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border", map[type] || map.on_site)}>
      {type.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

export default function InternshipsPage() {
  const { user } = useAdminAuth();
  const role = user?.role || "department_admin";

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const roleInternships = useMemo(() => {
    if (role === "super_admin" || role === "admin") return mockInternships;
    if (role === "college_admin") return mockInternships.filter(i => i.college_id === "college-001");
    return mockInternships.filter(i => i.department_id === "dept-001");
  }, [role]);

  const filtered = useMemo(() => {
    return roleInternships.filter(i => {
      const matchesSearch = !search ||
        i.student_name.toLowerCase().includes(search.toLowerCase()) ||
        i.company_name.toLowerCase().includes(search.toLowerCase()) ||
        i.role.toLowerCase().includes(search.toLowerCase());
      const matchesStage = stageFilter === "all" || i.verification_stage === stageFilter;
      const matchesType = typeFilter === "all" || i.internship_type === typeFilter;
      return matchesSearch && matchesStage && matchesType;
    });
  }, [roleInternships, search, stageFilter, typeFilter]);

  const verified = roleInternships.filter(i => i.status === "verified").length;
  const pending = roleInternships.filter(i => i.status === "pending").length;
  const rejected = roleInternships.filter(i => i.status === "rejected").length;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Internship Management"
          description={role === "super_admin" ? "All internships platform-wide" : role === "college_admin" ? "Internships in your college" : "Internships in your department"}
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Total Internships", value: roleInternships.length, icon: Briefcase, color: "cyan" as const },
              { title: "Verified", value: verified, icon: CheckCircle2, color: "emerald" as const },
              { title: "Pending Review", value: pending, icon: Clock, color: "amber" as const, badge: pending > 0 ? "Queue" : undefined },
              { title: "Rejected", value: rejected, icon: XCircle, color: "rose" as const },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Table Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
          >
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Internship Records</h3>
                  <p className="font-mono text-[10px] text-slate-500">{filtered.length} records</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search internships..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 w-52 transition-all"
                  />
                </div>

                <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer">
                  <option value="all">All Stages</option>
                  <option value="submitted">Submitted</option>
                  <option value="tp_review">TP Review</option>
                  <option value="mentor_review">Mentor Review</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer">
                  <option value="all">All Types</option>
                  <option value="on_site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {["Student", "Company & Role", "Type", "Duration", "Stage", "Actions"].map(col => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-500">
                        <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold">No internships found</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((int, idx) => (
                      <motion.tr
                        key={int.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-100 border border-purple-200 flex items-center justify-center font-bold text-[11px] text-purple-700 shrink-0">
                              {int.student_name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">{int.student_name}</p>
                              <p className="font-mono text-[10px] text-slate-500">{int.registration_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                              <Building2 className="w-3 h-3 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{int.company_name}</p>
                              <p className="text-[10px] text-slate-500">{int.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <TypeBadge type={int.internship_type} />
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-mono text-[10px] text-slate-700">{int.start_date}</p>
                          <p className="font-mono text-[10px] text-slate-500">→ {int.end_date}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <StageBadge stage={int.verification_stage} />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <button className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[10px] font-bold flex items-center gap-1 transition-all">
                              <Eye className="w-3 h-3" />
                              Review
                            </button>
                            {int.status === "pending" && (
                              <>
                                <button className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 transition-all" title="Approve">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-all" title="Reject">
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/40 flex items-center justify-between">
              <p className="font-mono text-[10px] text-slate-500">
                Showing {filtered.length} of {roleInternships.length} records
              </p>
              <div className="flex items-center gap-1.5">
                {[1, 2].map(n => (
                  <button key={n} className={clsx("w-7 h-7 rounded-lg text-[11px] font-mono font-bold transition-all border", n === 1 ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
