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
  Filter,
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
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </span>
        );
      case "manual_review":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Needs Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar pendingReviewCount={analytics?.pending_reviews} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Executive Verification Dashboard"
          description="Real-time biometric validation, document OCR compliance, and student status."
        />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Registered Students"
              value={analytics?.total_users ?? "—"}
              subtitle="All student accounts"
              icon={Users}
              color="indigo"
            />
            <StatCard
              title="Verified Interns"
              value={analytics?.verified_users ?? "—"}
              subtitle="Completed all 3 steps"
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Pending Reviews"
              value={analytics?.pending_reviews ?? "—"}
              subtitle="Awaiting manual check"
              icon={Clock}
              color="amber"
              badge={analytics?.pending_reviews ? "Action Needed" : undefined}
            />
            <StatCard
              title="Rejected IDs"
              value={analytics?.rejected_verifications ?? "—"}
              subtitle="Flagged or illegible"
              icon={XCircle}
              color="rose"
            />
            <StatCard
              title="Active Colleges"
              value={analytics?.active_colleges ?? "—"}
              subtitle="Participating institutions"
              icon={Building2}
              color="purple"
            />
          </div>

          {/* Verification Review Queue Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Table Action Bar */}
            <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Student Verification Queue</span>
                  <span className="text-xs bg-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-full">
                    {totalItems} total
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review physical college ID card uploads and OCR confidence matches.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, email, roll #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-64"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Submissions</option>
                  <option value="manual_review">Needs Review Only</option>
                  <option value="verified">Verified Only</option>
                  <option value="rejected">Rejected Only</option>
                  <option value="pending">Pending</option>
                </select>

                {/* Refresh Button */}
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  title="Refresh Table"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-5">Student</th>
                    <th className="py-3 px-5">Institution</th>
                    <th className="py-3 px-5">College ID</th>
                    <th className="py-3 px-5">Biometric Face</th>
                    <th className="py-3 px-5">Overall Status</th>
                    <th className="py-3 px-5">OCR Confidence</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                        Loading student records...
                      </td>
                    </tr>
                  ) : verifications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        No verification records match the current filter.
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
                          className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                          onClick={() => handleOpenReview(item)}
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 font-bold text-xs text-indigo-400 flex items-center justify-center shrink-0">
                                {item.user_name[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                                  {item.user_name}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {item.registration_number} • {item.user_email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5 text-slate-300">
                            {item.college_name || <span className="text-slate-400">Not selected</span>}
                          </td>

                          <td className="py-3.5 px-5">
                            {getStatusBadge(item.college_id_status)}
                          </td>

                          <td className="py-3.5 px-5">
                            {getStatusBadge(item.face_status)}
                          </td>

                          <td className="py-3.5 px-5">
                            {getStatusBadge(item.overall_status)}
                          </td>

                          <td className="py-3.5 px-5">
                            {conf !== null ? (
                              <span
                                className={`font-semibold ${
                                  conf >= 80
                                    ? "text-emerald-400"
                                    : conf >= 60
                                    ? "text-amber-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {conf}%
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReview(item);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs inline-flex items-center gap-1 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Review
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
