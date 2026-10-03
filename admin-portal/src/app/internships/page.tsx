"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Briefcase,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Building,
  FileText,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Download,
  X,
  Phone,
  Mail,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AdminInternshipItem, InternshipStage } from "@/types/admin";
import { api } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";

const STAGE_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  submitted: {
    label: "Submitted",
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  tp_review: {
    label: "T&P Cell",
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  mentor_review: {
    label: "Mentor Review",
    color: "text-purple-800",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  verified: {
    label: "Verified",
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    color: "text-rose-800",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
};

export default function InternshipsPage() {
  const { isLoading: authLoading } = useAdminAuth();
  const [internships, setInternships] = useState<AdminInternshipItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Selected internship for detail / verification drawer
  const [selectedInternship, setSelectedInternship] = useState<AdminInternshipItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [proofBlobUrl, setProofBlobUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchInternships = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const res = await api.getAdminInternships({
        stage: stageFilter !== "all" ? stageFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search.trim() || undefined,
        page,
        page_size: pageSize,
      });
      setInternships(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load internships";
      setFetchError(msg);
      console.error("Failed to load internships:", err);
    } finally {
      setIsLoading(false);
    }
  }, [stageFilter, statusFilter, search, page, pageSize]);

  useEffect(() => {
    if (!authLoading) {
      fetchInternships();
    }
  }, [authLoading, fetchInternships]);

  // Load proof document when drawer opens
  useEffect(() => {
    if (selectedInternship && isDrawerOpen && selectedInternship.offer_letter_url) {
      setLoadingProof(true);
      api
        .getInternshipProofBlob(selectedInternship.id)
        .then((url) => setProofBlobUrl(url))
        .catch(() => setProofBlobUrl(null))
        .finally(() => setLoadingProof(false));
    } else {
      setProofBlobUrl(null);
    }
  }, [selectedInternship, isDrawerOpen]);

  const handleOpenDrawer = (item: AdminInternshipItem) => {
    setSelectedInternship(item);
    setShowRejectInput(false);
    setRejectionReason("");
    setActionSuccess(null);
    setIsDrawerOpen(true);
  };

  const handleUpdateStage = async (stage: InternshipStage, status?: string) => {
    if (!selectedInternship) return;
    try {
      setActionLoading(true);
      setActionSuccess(null);
      await api.updateInternshipStatus(selectedInternship.id, {
        verification_stage: stage,
        status: status || (stage === "verified" ? "verified" : stage === "rejected" ? "rejected" : "pending"),
        rejection_reason:
          stage === "rejected"
            ? rejectionReason.trim() || "Offer letter or details did not meet requirements."
            : undefined,
      });

      setSelectedInternship((prev) =>
        prev
          ? {
              ...prev,
              verification_stage: stage,
              status: status || (stage === "verified" ? "verified" : stage === "rejected" ? "rejected" : "pending"),
              rejection_reason: stage === "rejected" ? rejectionReason : null,
            }
          : null
      );
      setActionSuccess(
        `Internship verification stage updated to "${STAGE_LABELS[stage]?.label || stage}". Live sync dispatched to mobile app!`
      );
      setShowRejectInput(false);
      fetchInternships();
    } catch (err: any) {
      alert(err.message || "Failed to update internship verification stage");
    } finally {
      setActionLoading(false);
    }
  };

  const filterTabs = [
    { id: "all", label: "All Internships" },
    { id: "submitted", label: "Submitted (Needs Review)" },
    { id: "tp_review", label: "T&P Cell" },
    { id: "mentor_review", label: "Mentor Review" },
    { id: "verified", label: "Verified" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Student Internship Oversight"
          description="Review industry company placements, inspect offer letters & credentials, and advance multi-stage compliance."
        />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Top Filter and Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {filterTabs.map((tab) => {
                const isActive = stageFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setStageFilter(tab.id);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm border border-sky-600"
                        : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, roll #, company, role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 w-72 transition-all shadow-xs"
                />
              </div>

              <button
                onClick={fetchInternships}
                disabled={isLoading}
                title="Refresh Table"
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
              </button>
            </div>
          </div>

          {fetchError && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Unable to fetch internships: {fetchError}</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Ensure the backend service is operational and synced.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchInternships}
                className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold transition-colors shrink-0 cursor-pointer"
              >
                Retry Query
              </button>
            </div>
          )}

          {/* Table of Internships */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-6">Student Intern</th>
                  <th className="py-4 px-6">Company & Role</th>
                  <th className="py-4 px-6">Mode & Location</th>
                  <th className="py-4 px-6">Proof Document</th>
                  <th className="py-4 px-6">Verification Stage</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-slate-500">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto mb-3">
                        <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
                      </div>
                      <p className="font-mono text-xs text-slate-700">Loading student internship postings...</p>
                    </td>
                  </tr>
                ) : internships.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-slate-500">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-slate-800 font-bold">No internships found</p>
                      <p className="text-[11px] text-slate-500 mt-1">Adjust the filter parameters to view records.</p>
                    </td>
                  </tr>
                ) : (
                  internships.map((item) => {
                    const stageMeta = STAGE_LABELS[item.verification_stage] || STAGE_LABELS.submitted;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenDrawer(item)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Student */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-100 border border-sky-200 font-bold text-xs text-sky-700 flex items-center justify-center shrink-0 shadow-xs">
                              {item.student_name[0]?.toUpperCase() || "S"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                                {item.student_name}
                              </p>
                              <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                                {item.student_registration_number} • {item.college_name || "Institution"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Company & Role */}
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-sky-600" />
                            {item.company_name}
                            {item.is_active && (
                              <span className="font-mono text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase">
                                Active
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.role}</p>
                        </td>

                        {/* Mode & Location */}
                        <td className="py-4 px-6 text-slate-700">
                          <p className="capitalize font-semibold text-slate-900">
                            {item.internship_type?.replace("_", "-") || "On-site"}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.location || "Remote / Cloud"}</p>
                        </td>

                        {/* Offer Letter / Email Proof */}
                        <td className="py-4 px-6">
                          {item.offer_letter_url ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[11px] font-semibold">
                              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Attached
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 text-[11px] italic">Missing</span>
                          )}
                        </td>

                        {/* Stage */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${stageMeta.bg} ${stageMeta.color} ${stageMeta.border}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                            {stageMeta.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(item);
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
        </main>
      </div>

      {/* Review Drawer / Modal */}
      {isDrawerOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white/95 sticky top-0 z-20 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                    {selectedInternship.company_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedInternship.role}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {actionSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Student Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Student Profile
                  </span>
                  <span className="font-mono text-[11px] text-sky-700 font-bold">
                    {selectedInternship.college_name || "Institution"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono">NAME</span>
                    <span className="font-bold text-slate-900">{selectedInternship.student_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono">ROLL / REG NO</span>
                    <span className="font-mono text-sky-700 font-bold">{selectedInternship.student_registration_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono">EMAIL</span>
                    <span className="truncate block font-medium">{selectedInternship.student_email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono">CONTACT</span>
                    <span className="font-medium">{selectedInternship.student_mobile || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Internship Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Placement Parameters
                </span>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono">DEPARTMENT</span>
                    <span className="font-medium">{selectedInternship.department || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono">WORK MODEL</span>
                    <span className="capitalize font-medium">{selectedInternship.internship_type.replace("_", "-")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono">LOCATION</span>
                    <span className="font-medium">{selectedInternship.location || "Remote / Unspecified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono">STIPEND</span>
                    <span className="font-mono text-amber-700 font-bold">{selectedInternship.stipend || "Unpaid / N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono">START DATE</span>
                    <span className="font-mono font-medium">{selectedInternship.start_date || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono">END DATE</span>
                    <span className="font-mono font-medium">{selectedInternship.end_date || "—"}</span>
                  </div>
                </div>

                {/* Supervisor info */}
                <div className="pt-2.5 border-t border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-mono mb-1">COMPANY SUPERVISOR</span>
                  <p className="font-bold text-slate-900">
                    {selectedInternship.supervisor_name || "Not specified"}
                  </p>
                  {(selectedInternship.supervisor_email || selectedInternship.supervisor_phone) && (
                    <p className="text-[11px] text-slate-600 flex items-center gap-3 mt-1 font-mono">
                      {selectedInternship.supervisor_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-sky-600" /> {selectedInternship.supervisor_email}
                        </span>
                      )}
                      {selectedInternship.supervisor_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-sky-600" /> {selectedInternship.supervisor_phone}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Uploaded Offer Letter / Email Proof */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-600" />
                    Offer Letter Document Proof
                  </span>
                  {proofBlobUrl && (
                    <a
                      href={proofBlobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Direct
                    </a>
                  )}
                </div>

                {loadingProof ? (
                  <div className="py-8 text-center text-slate-500 flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
                    <span className="font-mono text-xs">Loading verified document stream...</span>
                  </div>
                ) : proofBlobUrl ? (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white max-h-60 flex items-center justify-center p-2 shadow-xs">
                      <iframe
                        src={proofBlobUrl}
                        className="w-full h-56 rounded border-0"
                        title="Proof Document Preview"
                      />
                    </div>
                    <div className="flex justify-end">
                      <a
                        href={proofBlobUrl}
                        download={`internship_proof_${selectedInternship.company_name}`}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs inline-flex items-center gap-2 border border-slate-200 transition-all cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Document
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-slate-500">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-xs">No offer letter document uploaded by student.</p>
                  </div>
                )}
              </div>

              {/* Current Pipeline Status Stepper */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Multi-Stage Verification Stepper
                </span>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  {[
                    { key: "submitted", title: "1. Submitted", rank: 1 },
                    { key: "tp_review", title: "2. T&P Cell", rank: 2 },
                    { key: "mentor_review", title: "3. Mentor", rank: 3 },
                    { key: "verified", title: "4. Verified", rank: 4 },
                  ].map((step) => {
                    const currentRank =
                      selectedInternship.verification_stage === "verified"
                        ? 4
                        : selectedInternship.verification_stage === "mentor_review"
                        ? 3
                        : selectedInternship.verification_stage === "tp_review"
                        ? 2
                        : selectedInternship.verification_stage === "submitted"
                        ? 1
                        : 0;

                    const isPassed = currentRank >= step.rank;
                    const isCurrent = selectedInternship.verification_stage === step.key;

                    return (
                      <div
                        key={step.key}
                        className={`p-2.5 rounded-xl border font-mono font-bold transition-all ${
                          isCurrent
                            ? "bg-sky-50 text-sky-800 border-sky-300 shadow-xs"
                            : isPassed
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-white text-slate-400 border-slate-200"
                        }`}
                      >
                        {step.title}
                      </div>
                    );
                  })}
                </div>

                {selectedInternship.rejection_reason && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <span className="font-bold block mb-0.5">Rejection Reason:</span>
                    {selectedInternship.rejection_reason}
                  </div>
                )}
              </div>

              {/* Admin Action Decision Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Compliance Stage Transitions
                </span>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleUpdateStage("tp_review")}
                    disabled={actionLoading}
                    className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Move to T&P Cell
                  </button>

                  <button
                    onClick={() => handleUpdateStage("mentor_review")}
                    disabled={actionLoading}
                    className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Move to Industry Mentor
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleUpdateStage("verified", "verified")}
                    disabled={actionLoading}
                    className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Verify Internship
                  </button>
                </div>

                {/* Reject Option */}
                <div className="pt-2 border-t border-slate-200">
                  {!showRejectInput ? (
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Flag / Reject Internship
                    </button>
                  ) : (
                    <div className="space-y-2.5 animate-in fade-in duration-200">
                      <label className="font-mono text-[10px] text-rose-600 font-bold uppercase tracking-wider block">
                        Rejection Justification (Transmitted to Student):
                      </label>
                      <textarea
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. Offer letter is invalid or expired, company supervisor unverified..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors shadow-xs"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setShowRejectInput(false)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateStage("rejected", "rejected")}
                          disabled={actionLoading}
                          className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-600/20 cursor-pointer"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
