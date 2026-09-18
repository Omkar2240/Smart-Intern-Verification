"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  Building,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ReviewDrawer } from "@/components/ReviewDrawer";
import { College, VerificationItem } from "@/types/admin";
import { api } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function VerificationsPage() {
  const { isLoading: authLoading } = useAdminAuth();
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("manual_review");
  const [search, setSearch] = useState("");
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchVerifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getVerifications({
        status: statusFilter,
        search,
        college_id: selectedCollegeId || undefined,
        page,
        page_size: pageSize,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to fetch verifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search, selectedCollegeId, page, pageSize]);

  useEffect(() => {
    if (!authLoading) {
      fetchVerifications();
      api.getColleges().then(setColleges).catch(console.error);
    }
  }, [authLoading, fetchVerifications]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  const tabs = [
    { id: "manual_review", label: "Needs Review", icon: AlertTriangle },
    { id: "all", label: "All Submissions", icon: ShieldCheck },
    { id: "verified", label: "Approved", icon: CheckCircle2 },
    { id: "rejected", label: "Rejected", icon: XCircle },
    { id: "pending", label: "In Progress", icon: Clock },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Student Verification Review Queue"
          description="High-priority manual verification console for physical student ID cards and OCR mismatches."
        />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setPage(1);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              {/* College Filter */}
              <div className="relative">
                <select
                  value={selectedCollegeId}
                  onChange={(e) => {
                    setSelectedCollegeId(e.target.value);
                    setPage(1);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 max-w-[200px]"
                >
                  <option value="">All Colleges</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, roll #, email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-60"
                />
              </div>

              <button
                onClick={fetchVerifications}
                disabled={isLoading}
                title="Refresh"
                className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-5">Student Information</th>
                    <th className="py-3.5 px-5">College Institution</th>
                    <th className="py-3.5 px-5">ID Card Photo</th>
                    <th className="py-3.5 px-5">Face Biometric</th>
                    <th className="py-3.5 px-5">OCR Extracted Roll #</th>
                    <th className="py-3.5 px-5">Rejection Reason</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                        Loading queue submissions...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        No submissions found in this queue.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const fields = item.extracted_metadata?.fields || {};
                      const isReview = item.college_id_status === "manual_review";

                      return (
                        <tr
                          key={item.user_id}
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDrawerOpen(true);
                          }}
                          className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                            isReview ? "bg-amber-500/5" : ""
                          }`}
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 font-bold text-xs text-indigo-400 flex items-center justify-center shrink-0">
                                {item.user_name[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{item.user_name}</p>
                                <p className="text-[11px] text-slate-400">
                                  {item.registration_number} • {item.user_email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5 text-slate-300 font-medium">
                            {item.college_name || "—"}
                          </td>

                          <td className="py-3.5 px-5">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                                item.college_id_status === "verified"
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : item.college_id_status === "manual_review"
                                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                  : item.college_id_status === "rejected"
                                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                  : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                              }`}
                            >
                              {item.college_id_status.replace("_", " ")}
                            </span>
                          </td>

                          <td className="py-3.5 px-5">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                                item.face_status === "verified"
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                              }`}
                            >
                              {item.face_status.replace("_", " ")}
                            </span>
                          </td>

                          <td className="py-3.5 px-5 font-mono text-indigo-300">
                            {fields.registration_number || <span className="text-slate-400 font-sans">—</span>}
                          </td>

                          <td className="py-3.5 px-5 max-w-[200px] truncate text-rose-400">
                            {item.rejection_reason || <span className="text-slate-400">—</span>}
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                                setIsDrawerOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-md shadow-indigo-600/20 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing {items.length} of {total} results
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-white">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ReviewDrawer
        item={selectedItem}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onActionComplete={fetchVerifications}
      />
    </div>
  );
}
