"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Search, Building2, MapPin, Calendar, ChevronRight, X, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { PaginationBar } from "@/components/PaginationBar";
import { TableSkeleton, ErrorBanner, EmptyState } from "@/components/UiStates";
import { InternshipStageBadge } from "@/components/StatusBadges";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type {
  AdminInternshipListResponse, AdminInternshipItem, College, UpdateInternshipStatusPayload,
} from "@/types/admin";
import { clsx } from "clsx";

interface Props {
  initialData: AdminInternshipListResponse | null;
  colleges: College[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export function InternshipsClient({ initialData, colleges }: Props) {
  const { user } = useAdminAuth();
  const role = user?.role ?? "department_admin";
  const isPlatformAdmin = role === "super_admin" || role === "admin";

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [page, setPage] = useState(1);

  const [detailItem, setDetailItem] = useState<AdminInternshipItem | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState<UpdateInternshipStatusPayload>({
    verification_stage: "", status: "pending", rejection_reason: null,
  });

  const debouncedSearch = useDebounce(search, 350);

  const { data, loading, error, refetch } = useApi(
    () => api.getAdminInternships({
      search: debouncedSearch || undefined,
      stage: stageFilter === "all" ? undefined : (stageFilter as never),
      status: statusFilter === "all" ? undefined : (statusFilter as never),
      college_id: collegeFilter || undefined,
      page, page_size: 20,
    }),
    [debouncedSearch, stageFilter, statusFilter, collegeFilter, page],
  );

  const items = data?.items ?? initialData?.items ?? [];
  const total = data?.total ?? initialData?.total ?? 0;

  const verified = items.filter((i) => i.status === "verified").length;
  const pending = items.filter((i) => i.status === "pending").length;
  const rejected = items.filter((i) => i.status === "rejected").length;

  const openDetail = (item: AdminInternshipItem) => {
    setDetailItem(item);
    setUpdateForm({
      verification_stage: item.verification_stage,
      status: item.status as "pending" | "verified" | "rejected",
      rejection_reason: item.rejection_reason ?? null,
    });
  };

  const handleUpdateStatus = async () => {
    if (!detailItem) return;
    setUpdating(true);
    try {
      await api.updateInternshipStatus(detailItem.id, updateForm);
      await refetch();
      setDetailItem(null);
    } catch { /* error stays */ }
    finally { setUpdating(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Internship Management"
          description={
            isPlatformAdmin ? "All student internships platform-wide"
              : role === "college_admin" ? "Internships in your college"
              : "Internships in your department"
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Total Internships", value: total, icon: Briefcase, color: "indigo" as const },
              { title: "Verified", value: verified, icon: CheckCircle2, color: "emerald" as const },
              { title: "Pending Review", value: pending, icon: Briefcase, color: "amber" as const },
              { title: "Rejected", value: rejected, icon: XCircle, color: "rose" as const },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Table Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
          >
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200"><Briefcase className="w-4 h-4 text-indigo-600" /></div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Internship Records</h3>
                  <p className="font-mono text-[10px] text-slate-500">{total.toLocaleString()} internships</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Company, role, student..." value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-48 transition-all"
                  />
                </div>
                <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Stages</option>
                  <option value="submitted">Submitted</option>
                  <option value="tp_review">TP Review</option>
                  <option value="mentor_review">Mentor Review</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
                {isPlatformAdmin && colleges.length > 0 && (
                  <select value={collegeFilter} onChange={(e) => { setCollegeFilter(e.target.value); setPage(1); }}
                    className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="">All Colleges</option>
                    {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            {error && <ErrorBanner message={error} onRetry={refetch} />}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {["Student", "Company / Role", "Type", "Duration", "Stage", "Status", "Action"].map((col) => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={7}><TableSkeleton rows={8} cols={7} /></td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState icon={Briefcase} title="No internships found" /></td></tr>
                  ) : (
                    items.map((item, idx) => (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => openDetail(item)}
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900 text-[11px] group-hover:text-sky-600 transition-colors">{item.student_name}</p>
                          <p className="font-mono text-[9px] text-slate-400">{item.student_registration_number}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <div>
                              <p className="font-semibold text-slate-900 text-[11px]">{item.company_name}</p>
                              <p className="text-[10px] text-slate-500">{item.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 capitalize">
                            {item.internship_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{item.start_date ? item.start_date.slice(0, 7) : "—"}</span>
                            <span>→</span>
                            <span>{item.end_date ? item.end_date.slice(0, 7) : "—"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4"><InternshipStageBadge stage={item.verification_stage} /></td>
                        <td className="py-3.5 px-4">
                          <span className={clsx("font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize",
                            STATUS_COLORS[item.status] ?? "bg-slate-50 text-slate-600 border-slate-200"
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetail(item); }}
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-600 transition-all"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar page={page} pageSize={20} total={total} onPageChange={setPage} />
          </motion.div>
        </main>
      </div>

      {/* Detail / Update Drawer */}
      <AnimatePresence>
        {detailItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setDetailItem(null)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{detailItem.company_name}</h3>
                  <p className="text-[11px] text-slate-500">{detailItem.student_name} · {detailItem.role}</p>
                </div>
                <button onClick={() => setDetailItem(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Info grid */}
                {[
                  { label: "Student", value: detailItem.student_name },
                  { label: "Email", value: detailItem.student_email },
                  { label: "Reg. No.", value: detailItem.student_registration_number },
                  { label: "Mobile", value: detailItem.student_mobile },
                  { label: "College", value: detailItem.college_name ?? "—" },
                  { label: "Type", value: detailItem.internship_type },
                  { label: "Location", value: detailItem.location ?? "—" },
                  { label: "Stipend", value: detailItem.stipend ?? "—" },
                  { label: "Supervisor", value: detailItem.supervisor_name ?? "—" },
                  { label: "Supervisor Email", value: detailItem.supervisor_email ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider w-28 shrink-0 pt-0.5">{label}</p>
                    <p className="text-[11px] text-slate-900 font-medium">{value}</p>
                  </div>
                ))}

                {/* Status update */}
                <div className="pt-4 border-t border-slate-200">
                  <p className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-3">Update Status</p>
                  <div className="space-y-3">
                    <div>
                      <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Verification Stage</label>
                      <select value={updateForm.verification_stage}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, verification_stage: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="tp_review">TP Review</option>
                        <option value="mentor_review">Mentor Review</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                      <select value={updateForm.status}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value as "pending" | "verified" | "rejected" }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    {updateForm.status === "rejected" && (
                      <div>
                        <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Rejection Reason</label>
                        <textarea
                          value={updateForm.rejection_reason ?? ""}
                          onChange={(e) => setUpdateForm((p) => ({ ...p, rejection_reason: e.target.value }))}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-sky-500 resize-none"
                          placeholder="Explain the reason for rejection..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-200 shrink-0">
                <button onClick={handleUpdateStatus} disabled={updating}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Update Status
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
