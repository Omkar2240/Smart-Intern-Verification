"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Briefcase,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  FileText,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Download,
  X,
  Send,
  UserCheck,
  Shield,
  Layers,
  MapPin,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AdminInternshipItem, InternshipStage } from "@/types/admin";
import { api } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";

const STAGE_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  submitted: {
    label: "Submitted",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  tp_review: {
    label: "T&P Cell Review",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  mentor_review: {
    label: "Mentor Review",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  verified: {
    label: "Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  rejected: {
    label: "Rejected",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
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
        rejection_reason: stage === "rejected" ? rejectionReason.trim() || "Offer letter or details did not meet requirements." : undefined,
      });

      // Update current selected item in view
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
      setActionSuccess(`Internship verification stage updated to "${STAGE_LABELS[stage]?.label || stage}". This change is now live on the student's mobile app!`);
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
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Student Internships & Verifications"
          description="Review company placements, inspect uploaded offer letter / email proofs, and update multi-stage approval statuses."
        />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Top Filter and Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, roll no, company, role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-72"
                />
              </div>

              <button
                onClick={fetchInternships}
                disabled={isLoading}
                title="Refresh"
                className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {fetchError && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-semibold">Unable to fetch internships: {fetchError}</p>
                  <p className="text-[11px] text-amber-400/80 mt-0.5">
                    If connected to Render Cloud, ensure the latest backend with the <code className="bg-slate-900 px-1 py-0.5 rounded">/admin/internships</code> route is pushed and deployed, or point <code className="bg-slate-900 px-1 py-0.5 rounded">admin-portal/.env</code> to your local backend (<code className="bg-slate-900 px-1 py-0.5 rounded">http://localhost:8000/api/v1</code>).
                  </p>
                </div>
              </div>
              <button
                onClick={fetchInternships}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium transition-colors shrink-0"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Table of Internships */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-5">Student & College</th>
                  <th className="py-3.5 px-5">Company & Role</th>
                  <th className="py-3.5 px-5">Mode & Location</th>
                  <th className="py-3.5 px-5">Offer / Email Proof</th>
                  <th className="py-3.5 px-5">Verification Pipeline</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                      Loading student internships...
                    </td>
                  </tr>
                ) : internships.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      No internships found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  internships.map((item) => {
                    const stageMeta = STAGE_LABELS[item.verification_stage] || STAGE_LABELS.submitted;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenDrawer(item)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        {/* Student */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 font-bold text-xs text-indigo-400 flex items-center justify-center shrink-0">
                              {item.student_name[0]?.toUpperCase() || "S"}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{item.student_name}</p>
                              <p className="text-[11px] text-slate-400">
                                {item.student_registration_number} • {item.college_name || "Institution"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Company & Role */}
                        <td className="py-3.5 px-5">
                          <p className="font-semibold text-white flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-indigo-400" />
                            {item.company_name}
                            {item.is_active && (
                              <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 py-0.2 rounded font-semibold uppercase">
                                Active
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">{item.role}</p>
                        </td>

                        {/* Mode & Location */}
                        <td className="py-3.5 px-5 text-slate-300">
                          <p className="capitalize font-medium">{item.internship_type?.replace("_", "-") || "On-site"}</p>
                          <p className="text-[11px] text-slate-400">{item.location || "Remote / Unspecified"}</p>
                        </td>

                        {/* Offer Letter / Email Proof */}
                        <td className="py-3.5 px-5">
                          {item.offer_letter_url ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                              <FileText className="w-3.5 h-3.5" />
                              Attached
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">Not Uploaded</span>
                          )}
                        </td>

                        {/* Stage */}
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${stageMeta.bg} ${stageMeta.color} ${stageMeta.border}`}
                          >
                            {stageMeta.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(item);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-all"
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
        </main>
      </div>

      {/* Review Drawer / Modal */}
      {isDrawerOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{selectedInternship.company_name}</h3>
                  <p className="text-xs text-slate-400">{selectedInternship.role}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {actionSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Student Summary Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Student Information
                  </span>
                  <span className="text-[11px] text-indigo-400 font-medium">
                    {selectedInternship.college_name || "Institution"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Name</span>
                    <span className="font-semibold text-white">{selectedInternship.student_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Roll / Reg Number</span>
                    <span className="font-mono text-white">{selectedInternship.student_registration_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Email</span>
                    <span>{selectedInternship.student_email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Mobile</span>
                    <span>{selectedInternship.student_mobile || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Internship Details Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Internship Details
                </span>
                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Department</span>
                    <span>{selectedInternship.department || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Work Type</span>
                    <span className="capitalize">{selectedInternship.internship_type.replace("_", "-")}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Location</span>
                    <span>{selectedInternship.location || "Remote / Unspecified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Stipend</span>
                    <span className="text-amber-400 font-semibold">{selectedInternship.stipend || "Unpaid / N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Start Date</span>
                    <span>{selectedInternship.start_date || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">End Date</span>
                    <span>{selectedInternship.end_date || "—"}</span>
                  </div>
                </div>

                {/* Supervisor info */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] mb-1">Company Supervisor</span>
                  <p className="font-medium text-white">
                    {selectedInternship.supervisor_name || "Not specified"}
                  </p>
                  {(selectedInternship.supervisor_email || selectedInternship.supervisor_phone) && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                      {selectedInternship.supervisor_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" /> {selectedInternship.supervisor_email}
                        </span>
                      )}
                      {selectedInternship.supervisor_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" /> {selectedInternship.supervisor_phone}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Uploaded Offer Letter / Email Proof */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Offer Letter / Email Proof Document
                  </span>
                  {proofBlobUrl && (
                    <a
                      href={proofBlobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Document
                    </a>
                  )}
                </div>

                {loadingProof ? (
                  <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                    <span>Loading proof document...</span>
                  </div>
                ) : proofBlobUrl ? (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 max-h-60 flex items-center justify-center p-2">
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
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Proof Document
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-center text-slate-400">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <p className="text-xs">No offer letter or proof document uploaded for this internship.</p>
                  </div>
                )}
              </div>

              {/* Current Pipeline Status Stepper */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Verification Workflow Progress
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
                        className={`p-2 rounded-lg border font-medium ${
                          isCurrent
                            ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-bold"
                            : isPassed
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}
                      >
                        {step.title}
                      </div>
                    );
                  })}
                </div>

                {selectedInternship.rejection_reason && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    <span className="font-semibold block mb-0.5">Rejection Reason:</span>
                    {selectedInternship.rejection_reason}
                  </div>
                )}
              </div>

              {/* Admin Action Decision Section */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Admin Verification Decisions
                </span>

                <p className="text-[11px] text-slate-400">
                  Update the verification stage for this internship. Any change made here will update the database and reflect live on the student&apos;s mobile app in real-time.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleUpdateStage("tp_review")}
                    disabled={actionLoading}
                    className="p-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    Move to T&P Cell
                  </button>

                  <button
                    onClick={() => handleUpdateStage("mentor_review")}
                    disabled={actionLoading}
                    className="p-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    Move to Industry Mentor
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleUpdateStage("verified", "verified")}
                    disabled={actionLoading}
                    className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Mark Verified
                  </button>
                </div>

                {/* Reject Option */}
                <div className="pt-2 border-t border-slate-800">
                  {!showRejectInput ? (
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject Internship Submission
                    </button>
                  ) : (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <label className="text-[11px] text-rose-400 font-semibold block">
                        Reason for Rejection (Visible to Student):
                      </label>
                      <textarea
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. Offer letter is expired, company supervisor unverified, or role mismatch..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setShowRejectInput(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateStage("rejected", "rejected")}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1"
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
