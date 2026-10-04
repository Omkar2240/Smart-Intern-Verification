"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Search, Eye, CheckCircle2, XCircle,
  RotateCcw, AlertTriangle, Clock, Zap, ChevronDown
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { mockStudents } from "@/data/mock/students.mock";
import { clsx } from "clsx";

// Build verification queue items from students
const verificationQueue = mockStudents.map(s => ({
  id: s.id,
  student_name: s.name,
  student_email: s.email,
  registration_number: s.registration_number,
  college_name: s.college_name,
  college_id: s.college_id,
  department_id: s.department_id,
  department_name: s.department_name,
  verification_status: s.verification_status,
  face_status: s.verification_status === "verified" ? "verified" :
    s.verification_status === "rejected" ? "rejected" :
    s.verification_status === "manual_review" ? "manual_review" : "pending",
  college_id_status: s.verification_status,
  confidence_score: s.verification_status === "verified" ? Math.floor(Math.random() * 15 + 85) :
    s.verification_status === "manual_review" ? Math.floor(Math.random() * 20 + 45) :
    s.verification_status === "rejected" ? Math.floor(Math.random() * 30 + 20) : null,
  created_at: s.created_at,
}));

function ConfidenceBar({ score }: { score: number | null }) {
  if (score === null) return <span className="font-mono text-slate-400 text-xs">—</span>;
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500";
  const textColor = score >= 80 ? "text-emerald-700" : score >= 60 ? "text-amber-700" : "text-rose-700";
  return (
    <div className="space-y-1 w-20">
      <div className="flex items-center justify-between">
        <span className={clsx("font-mono text-[11px] font-bold", textColor)}>{score}%</span>
        <span className="font-mono text-[9px] text-slate-400">Match</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={clsx("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; cls: string }> = {
    verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    pending: { label: "Pending", cls: "bg-slate-50 text-slate-600 border-slate-200" },
    manual_review: { label: "Needs Review", cls: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" },
    rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200" },
    not_started: { label: "Not Started", cls: "bg-slate-50 text-slate-500 border-slate-200" },
  };
  const cfg = configs[status] || configs.pending;
  return (
    <span className={clsx("inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border", cfg.cls)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

export default function VerificationsPage() {
  const { user } = useAdminAuth();
  const role = user?.role || "department_admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<(typeof verificationQueue)[0] | null>(null);

  const roleQueue = useMemo(() => {
    if (role === "super_admin" || role === "admin") return verificationQueue;
    if (role === "college_admin") return verificationQueue.filter(v => v.college_id === "college-001");
    return verificationQueue.filter(v => v.department_id === "dept-001");
  }, [role]);

  const filtered = useMemo(() => roleQueue.filter(v => {
    const matchSearch = !search ||
      v.student_name.toLowerCase().includes(search.toLowerCase()) ||
      v.registration_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || v.verification_status === statusFilter;
    return matchSearch && matchStatus;
  }), [roleQueue, search, statusFilter]);

  const verified = roleQueue.filter(v => v.verification_status === "verified").length;
  const pending = roleQueue.filter(v => v.verification_status === "pending" || v.verification_status === "manual_review").length;
  const rejected = roleQueue.filter(v => v.verification_status === "rejected").length;
  const needsReview = roleQueue.filter(v => v.verification_status === "manual_review").length;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar pendingReviewCount={needsReview} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Verification Center"
          description={
            role === "super_admin" ? "Platform-wide identity verification queue" :
            role === "college_admin" ? "Identity verification — Your college" :
            "Identity verification — Your department"
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Total Submissions", value: roleQueue.length, icon: ShieldCheck, color: "cyan" as const },
              { title: "Verified", value: verified, icon: CheckCircle2, color: "emerald" as const },
              { title: "Needs Review", value: needsReview, icon: AlertTriangle, color: "amber" as const, badge: needsReview > 0 ? "Action" : undefined },
              { title: "Rejected", value: rejected, icon: XCircle, color: "rose" as const },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Table */}
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
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                    Identity Verification Queue
                    <span className="font-mono text-[10px] bg-white text-sky-700 border border-slate-200 font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {filtered.length} records
                    </span>
                  </h3>
                  <p className="font-mono text-[10px] text-slate-500">OCR parsing, face embeddings, institutional whitelist</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by name, roll #..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-52 transition-all"
                  />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none">
                  <option value="all">All Submissions</option>
                  <option value="manual_review">Needs Review</option>
                  <option value="verified">Verified Only</option>
                  <option value="rejected">Rejected Only</option>
                  <option value="pending">Pending</option>
                  <option value="not_started">Not Started</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {["Student Intern", "Institution", "College ID Status", "Face Biometrics", "Pipeline Status", "OCR Confidence", "Actions"].map(col => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-500">
                        <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold">No verification records</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item, idx) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-100 border border-sky-200 font-bold text-[11px] text-sky-700 flex items-center justify-center shrink-0">
                              {item.student_name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{item.student_name}</p>
                              <p className="font-mono text-[10px] text-slate-500">{item.registration_number} · {item.student_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          <p className="text-[11px]">{item.college_name?.split(" ").slice(0, 3).join(" ")}...</p>
                        </td>
                        <td className="py-3.5 px-4"><StatusBadge status={item.college_id_status} /></td>
                        <td className="py-3.5 px-4"><StatusBadge status={item.face_status} /></td>
                        <td className="py-3.5 px-4"><StatusBadge status={item.verification_status} /></td>
                        <td className="py-3.5 px-4"><ConfidenceBar score={item.confidence_score} /></td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedItem(item); }}
                              className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                            >
                              <Eye className="w-3 h-3" /> Inspect
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setSelectedItem(null)}>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-full max-w-sm bg-white border-l border-slate-200 shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Verification Review</h3>
                  <p className="font-mono text-[10px] text-slate-500">ID · Biometric · Status</p>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all text-lg font-light">×</button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Student Info */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center font-extrabold text-white text-lg">
                    {selectedItem.student_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{selectedItem.student_name}</p>
                    <p className="font-mono text-[10px] text-slate-500">{selectedItem.registration_number}</p>
                    <p className="font-mono text-[10px] text-slate-500">{selectedItem.student_email}</p>
                  </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "College ID", status: selectedItem.college_id_status },
                    { label: "Face Biometric", status: selectedItem.face_status },
                    { label: "Overall Status", status: selectedItem.verification_status },
                    { label: "OCR Confidence", status: selectedItem.confidence_score ? `${selectedItem.confidence_score}%` : "N/A" },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="font-mono text-[9px] text-slate-400 uppercase mb-1">{item.label}</p>
                      {typeof item.status === "string" && item.status.includes("%") ? (
                        <p className="font-mono text-[13px] font-extrabold text-slate-900">{item.status}</p>
                      ) : (
                        <StatusBadge status={item.status as string} />
                      )}
                    </div>
                  ))}
                </div>

                {/* College Info */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-mono text-[9px] text-slate-400 uppercase mb-1.5">Institution</p>
                  <p className="text-[12px] font-semibold text-slate-900">{selectedItem.college_name}</p>
                  <p className="font-mono text-[10px] text-slate-500">{selectedItem.department_name}</p>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                  <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Actions</p>
                  <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-[12px] flex items-center justify-center gap-2 transition-all shadow-sm">
                    <CheckCircle2 className="w-4 h-4" /> Approve Verification
                  </button>
                  <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-[12px] flex items-center justify-center gap-2 transition-all shadow-sm">
                    <RotateCcw className="w-4 h-4" /> Reset Biometrics
                  </button>
                  <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-bold text-[12px] flex items-center justify-center gap-2 transition-all shadow-sm">
                    <Zap className="w-4 h-4" /> Force Verify
                  </button>
                  <button className="w-full py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[12px] flex items-center justify-center gap-2 transition-all">
                    <XCircle className="w-4 h-4" /> Reject & Flag
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
