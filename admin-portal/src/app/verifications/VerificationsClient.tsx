"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { ReviewDrawer } from "@/components/ReviewDrawer";
import { PaginationBar } from "@/components/PaginationBar";
import { TableSkeleton, ErrorBanner, EmptyState } from "@/components/UiStates";
import { VerificationStatusBadge } from "@/components/StatusBadges";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { VerificationItem, VerificationListResponse } from "@/types/admin";

interface Props {
  initialData: VerificationListResponse | null;
}

export function VerificationsClient({ initialData }: Props) {
  const { user } = useAdminAuth();
  const role = user?.role ?? "department_admin";

  // ── Filter state ────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  // ── Fetch ───────────────────────────────────────────────────────────────
  const { data, loading, error, refetch } = useApi(
    () =>
      api.getVerifications({
        status: statusFilter === "all" ? undefined : (statusFilter as never),
        search: debouncedSearch || undefined,
        page,
        page_size: 20,
      }),
    [statusFilter, debouncedSearch, page],
    { immediate: true }
  );

  const items = data?.items ?? initialData?.items ?? [];
  const total = data?.total ?? initialData?.total ?? 0;
  const pageSize = 20;

  // ── Stats ───────────────────────────────────────────────────────────────
  const verified = items.filter((v) => v.overall_status === "verified").length;
  const needsReview = items.filter(
    (v) => v.overall_status === "manual_review"
  ).length;
  const rejected = items.filter((v) => v.overall_status === "rejected").length;

  const handleFilterChange = useCallback(
    (newStatus: string) => {
      setStatusFilter(newStatus);
      setPage(1);
    },
    []
  );

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar pendingReviewCount={needsReview > 0 ? needsReview : undefined} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Verification Center"
          description={
            role === "super_admin" || role === "admin"
              ? "Platform-wide identity verification queue"
              : role === "college_admin"
                ? "Identity verification — Your college"
                : "Identity verification — Your department"
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Total Submissions", value: total, icon: ShieldCheck, color: "cyan" as const },
              { title: "Verified", value: verified, icon: CheckCircle2, color: "emerald" as const },
              { title: "Needs Review", value: needsReview, icon: AlertTriangle, color: "amber" as const, badge: needsReview > 0 ? "Action" : undefined },
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
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                    Identity Verification Queue
                    <span className="font-mono text-[10px] bg-white text-sky-700 border border-slate-200 font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {total.toLocaleString()} records
                    </span>
                  </h3>
                  <p className="font-mono text-[10px] text-slate-500">
                    OCR parsing, face embeddings, institutional whitelist
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by name, roll #..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-52 transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Submissions</option>
                  <option value="manual_review">Needs Review</option>
                  <option value="verified">Verified Only</option>
                  <option value="rejected">Rejected Only</option>
                  <option value="pending">Pending</option>
                  <option value="not_started">Not Started</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {error && <ErrorBanner message={error} onRetry={refetch} />}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {[
                      "Student Name",
                      "Enrollment/PRN",
                      "Email",
                      "Institution",
                      "College ID Status",
                      "Face Biometrics",
                      "Overall",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8}>
                        <TableSkeleton rows={8} cols={8} />
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState
                          icon={ShieldCheck}
                          title="No verification records"
                          description="No records match your current filters."
                        />
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <motion.tr
                        key={item.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-100 border border-sky-200 font-bold text-[11px] text-sky-700 flex items-center justify-center shrink-0">
                              {item.user_name[0]}
                            </div>
                            <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                              {item.user_name}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-mono text-[10px] text-slate-600">
                            {item.registration_number || "—"}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-[11px] text-slate-600 line-clamp-1">
                            {item.user_email}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          <p className="text-[11px] font-semibold text-slate-900 line-clamp-1">
                            {item.college_name || "—"}
                          </p>
                          {item.department_name && (
                            <p className="text-[10px] text-slate-500 font-mono line-clamp-1 mt-0.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                              {item.department_name}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <VerificationStatusBadge status={item.college_id_status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <VerificationStatusBadge status={item.face_status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <VerificationStatusBadge status={item.overall_status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                          >
                            <Eye className="w-3 h-3" /> Inspect
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </motion.div>
        </main>
      </div>

      <ReviewDrawer
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onActionComplete={refetch}
      />
    </div>
  );
}
