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
    { id: "manual_review", label: "Needs Review", icon: AlertTriangle, countColor: "text-amber-600" },
    { id: "all", label: "All Submissions", icon: ShieldCheck, countColor: "text-sky-600" },
    { id: "verified", label: "Approved", icon: CheckCircle2, countColor: "text-emerald-600" },
    { id: "rejected", label: "Flagged / Rejected", icon: XCircle, countColor: "text-rose-600" },
    { id: "pending", label: "Pending Capture", icon: Clock, countColor: "text-slate-500" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Verification Oversight Queue"
          description="High-priority forensic inspection workstation for student ID card OCR, face biometrics, and credentials."
        />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Status Tabs and Quick Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex flex-wrap items-center gap-2">
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm border border-sky-600"
                        : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/90 shadow-xs"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : tab.countColor}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* College Filter */}
              <div className="relative">
                <select
                  value={selectedCollegeId}
                  onChange={(e) => {
                    setSelectedCollegeId(e.target.value);
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-sky-500 max-w-[210px] font-medium shadow-xs"
                >
                  <option value="">All Affiliated Colleges</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, roll #, email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 w-64 transition-all shadow-xs"
                />
              </div>

              <button
                onClick={fetchVerifications}
                disabled={isLoading}
                title="Refresh Table"
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-4 px-6">Student Intern</th>
                    <th className="py-4 px-6">Affiliated College</th>
                    <th className="py-4 px-6">College ID Status</th>
                    <th className="py-4 px-6">Face Biometrics</th>
                    <th className="py-4 px-6">OCR Roll # Match</th>
                    <th className="py-4 px-6">Flagging Reason</th>
                    <th className="py-4 px-6 text-right">Oversight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-slate-500">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto mb-3">
                          <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
                        </div>
                        <p className="font-mono text-xs text-slate-700">Loading queue items...</p>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-slate-500">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <p className="text-xs text-slate-800 font-bold">Queue clear</p>
                        <p className="text-[11px] text-slate-500 mt-1">No submissions currently in this category.</p>
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
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                            isReview ? "bg-amber-50/30" : ""
                          }`}
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
                              <span className="font-mono text-slate-400 italic">Not selected</span>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                                item.college_id_status === "verified"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : item.college_id_status === "manual_review"
                                  ? "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                                  : item.college_id_status === "rejected"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {item.college_id_status.replace("_", " ")}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                                item.face_status === "verified"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {item.face_status.replace("_", " ")}
                            </span>
                          </td>

                          <td className="py-4 px-6 font-mono text-sky-700 font-bold text-xs">
                            {fields.registration_number || (
                              <span className="text-slate-400 font-sans italic">—</span>
                            )}
                          </td>

                          <td className="py-4 px-6 max-w-[200px] truncate text-rose-600 font-medium">
                            {item.rejection_reason || <span className="text-slate-400">—</span>}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                                setIsDrawerOpen(true);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
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
            <div className="p-4.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>
                Showing {items.length} of {total} records
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-900 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
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
