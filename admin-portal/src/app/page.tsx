"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  RefreshCw,
  Search,
  Eye,
  AlertTriangle,
  ChevronRight,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { ReviewDrawer } from "@/components/ReviewDrawer";
import { AnalyticsSummary, VerificationItem } from "@/types/admin";
import { api } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function DashboardPage() {
  const { isLoading: authLoading } = useAdminAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [stats, list] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getVerifications({
          status: statusFilter,
          search: searchQuery,
          page: 1,
          page_size: 15,
        }),
      ]);
      setAnalytics(stats);
      setVerifications(list.items);
      setTotalItems(list.total);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  const handleOpenReview = (item: VerificationItem) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            VERIFIED
          </span>
        );
      case "manual_review":
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 shadow-xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            NEEDS REVIEW
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar pendingReviewCount={analytics?.pending_reviews} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Executive Verification Console"
          description="Real-time multi-stage biometric validation, OCR confidence telemetry, and enrollment audits."
        />

        <main className="flex-1 p-8 space-y-7 overflow-y-auto">
          {/* KPI Stat Cards Grid with staggered entry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-reveal-1">
            <StatCard
              title="Registered Interns"
              value={analytics?.total_users ?? "—"}
              subtitle="All student accounts"
              icon={Users}
              color="cyan"
            />
            <StatCard
              title="Verified Profiles"
              value={analytics?.verified_users ?? "—"}
              subtitle="3-tier validation cleared"
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Pending Reviews"
              value={analytics?.pending_reviews ?? "—"}
              subtitle="Awaiting manual audit"
              icon={Clock}
              color="amber"
              badge={analytics?.pending_reviews ? "Queue Active" : undefined}
            />
            <StatCard
              title="Flagged IDs"
              value={analytics?.rejected_verifications ?? "—"}
              subtitle="OCR or face mismatch"
              icon={XCircle}
              color="rose"
            />
            <StatCard
              title="Affiliated Colleges"
              value={analytics?.active_colleges ?? "—"}
              subtitle="Whitelisted institutions"
              icon={Building2}
              color="indigo"
            />
          </div>

          {/* Internship Status Operations Banner */}
          <div className="animate-reveal-2 relative p-6 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-indigo-50/40 border border-sky-200/80 shadow-xs overflow-hidden group">
            <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs group-hover:scale-105 transition-transform">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Student Internship & Multi-Stage Oversight
                    </h3>
                    <span className="font-mono text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Live Mobile Sync
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl">
                    Review student company postings, verify uploaded offer letters / proof documents, and manage approval stages with automated anti-tamper checking.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-6 px-4 py-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="text-right">
                    <span className="font-mono text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                      Total
                    </span>
                    <span className="font-mono text-base font-extrabold text-slate-900">
                      {analytics?.total_internships ?? 0}
                    </span>
                  </div>
                  <div className="h-7 w-[1px] bg-slate-200" />
                  <div className="text-right">
                    <span className="font-mono text-amber-700 block text-[10px] uppercase font-bold tracking-wider">
                      Pending
                    </span>
                    <span className="font-mono text-base font-extrabold text-amber-700">
                      {analytics?.pending_internships ?? 0}
                    </span>
                  </div>
                  <div className="h-7 w-[1px] bg-slate-200" />
                  <div className="text-right">
                    <span className="font-mono text-emerald-700 block text-[10px] uppercase font-bold tracking-wider">
                      Verified
                    </span>
                    <span className="font-mono text-base font-extrabold text-emerald-700">
                      {analytics?.verified_internships ?? 0}
                    </span>
                  </div>
                </div>

                <a
                  href="/internships"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
                >
                  <span>Manage Internships</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Verification Review Queue Section */}
          <div className="animate-reveal-3 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            {/* Table Action Bar */}
            <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                    <span>Identity Verification Queue</span>
                    <span className="font-mono text-[10px] bg-white text-sky-700 border border-slate-200 font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {totalItems} records
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Physical student ID card OCR parsing, face embedding comparisons, and institutional whitelist audits.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by name, email, roll #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 w-64 transition-all"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-500 transition-all cursor-pointer font-medium"
                  >
                    <option value="all">All Submissions</option>
                    <option value="manual_review">Needs Review Only</option>
                    <option value="verified">Verified Only</option>
                    <option value="rejected">Rejected Only</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  title="Refresh Table"
                  className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Student Intern</th>
                    <th className="py-3.5 px-6">Institution</th>
                    <th className="py-3.5 px-6">College ID</th>
                    <th className="py-3.5 px-6">Face Biometrics</th>
                    <th className="py-3.5 px-6">Pipeline Status</th>
                    <th className="py-3.5 px-6">OCR Confidence</th>
                    <th className="py-3.5 px-6 text-right">Oversight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-500">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto mb-3">
                          <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
                        </div>
                        <p className="font-mono text-xs text-slate-700">Synchronizing verification telemetry...</p>
                      </td>
                    </tr>
                  ) : verifications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-500">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <Search className="w-5 h-5" />
                        </div>
                        <p className="text-xs text-slate-800 font-semibold">No verification records found</p>
                        <p className="text-[11px] text-slate-500 mt-1">Try adjusting the search query or status filter.</p>
                      </td>
                    </tr>
                  ) : (
                    verifications.map((item) => {
                      const meta = item.extracted_metadata || {};
                      const conf = meta.verification?.confidence_score
                        ? Math.round(meta.verification.confidence_score * 100)
                        : null;

                      return (
                        <tr
                          key={item.user_id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => handleOpenReview(item)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-100 border border-sky-200 font-bold text-xs text-sky-700 flex items-center justify-center shrink-0 shadow-xs">
                                {item.user_name[0]?.toUpperCase() || "S"}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                                  {item.user_name}
                                </p>
                                <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                                  {item.registration_number || "NO-ROLL"} • {item.user_email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-slate-700 font-medium">
                            {item.college_name || (
                              <span className="font-mono text-slate-400 italic">Not affiliated</span>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            {getStatusBadge(item.college_id_status)}
                          </td>

                          <td className="py-4 px-6">
                            {getStatusBadge(item.face_status)}
                          </td>

                          <td className="py-4 px-6">
                            {getStatusBadge(item.overall_status)}
                          </td>

                          <td className="py-4 px-6">
                            {conf !== null ? (
                              <div className="space-y-1.5 w-24">
                                <div className="flex items-center justify-between font-mono text-[11px]">
                                  <span
                                    className={`font-bold ${
                                      conf >= 80
                                        ? "text-emerald-700"
                                        : conf >= 60
                                        ? "text-amber-700"
                                        : "text-rose-700"
                                    }`}
                                  >
                                    {conf}%
                                  </span>
                                  <span className="text-[9px] text-slate-400 uppercase">Match</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                  <div
                                    className={`h-full rounded-full ${
                                      conf >= 80
                                        ? "bg-emerald-500"
                                        : conf >= 60
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                    style={{ width: `${conf}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="font-mono text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReview(item);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Side-by-side Review Drawer */}
      <ReviewDrawer
        item={selectedItem}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onActionComplete={fetchData}
      />
    </div>
  );
}
