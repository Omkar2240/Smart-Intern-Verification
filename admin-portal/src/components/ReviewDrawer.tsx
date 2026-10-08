"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Briefcase,
  FileText,
  Building,
  ShieldCheck,
  Cpu,
  Scan,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { VerificationItem, InternshipStage } from "@/types/admin";
import { api } from "@/lib/api";
import { SmartIdCard } from "@/components/SmartIdCard";

interface ReviewDrawerProps {
  item: VerificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

const REJECTION_REASONS = [
  "Document image is blurry or illegible",
  "Student name on ID card does not match registration account",
  "Registration number does not match submitted ID",
  "ID card belongs to a different institution",
  "ID card has expired / invalid academic year",
  "Incomplete document / cut-off edges",
  "Suspected counterfeit or tampered document",
];

export function ReviewDrawer({
  item,
  isOpen,
  onClose,
  onActionComplete,
}: ReviewDrawerProps) {
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isForceVerifying, setIsForceVerifying] = useState(false);
  const [isResettingBio, setIsResettingBio] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [internshipActionId, setInternshipActionId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [cardTab, setCardTab] = useState<"smart_card" | "scan">("smart_card");

  useEffect(() => {
    if (item && isOpen) {
      setImageLoading(true);
      setImageError(null);
      api
        .getCardImageBlob(item.user_id)
        .then((url) => {
          setImageUrl(url);
          setImageError(null);
          setCardTab("scan");
        })
        .catch((err) => {
          setImageUrl(null);
          const msg = err instanceof Error ? err.message : "Physical ID card image not found on storage node";
          setImageError(msg);
          setCardTab("smart_card");
        })
        .finally(() => setImageLoading(false));
    } else {
      setImageUrl(null);
      setImageError(null);
      setCardTab("smart_card");
    }
  }, [item, isOpen]);

  const handleRetryFetch = () => {
    if (!item) return;
    setImageLoading(true);
    setImageError(null);
    api
      .getCardImageBlob(item.user_id)
      .then((url) => {
        setImageUrl(url);
        setImageError(null);
        setCardTab("scan");
      })
      .catch((err) => {
        setImageUrl(null);
        const msg = err instanceof Error ? err.message : "Physical ID card image not found on storage node";
        setImageError(msg);
      })
      .finally(() => setImageLoading(false));
  };

  if (!isOpen || !item) return null;

  const metadata = item.extracted_metadata || {};
  const fields = metadata.fields || {};
  const verification = metadata.verification || {};
  const confidence = verification.confidence_score
    ? Math.round(verification.confidence_score * 100)
    : null;

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setActionError(null);
      await api.approveVerification(item.user_id);
      onActionComplete();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Approval failed";
      setActionError(msg);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    const reason = customReason.trim() || selectedReason;
    try {
      setIsRejecting(true);
      setActionError(null);
      await api.rejectVerification(item.user_id, reason);
      onActionComplete();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Rejection failed";
      setActionError(msg);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleForceVerify = async () => {
    try {
      setIsForceVerifying(true);
      setActionError(null);
      await api.forceVerifyStudent(item.user_id);
      setSuccessMsg("Student identity successfully verified! Changes are live on their mobile app.");
      onActionComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Force verification failed";
      setActionError(msg);
    } finally {
      setIsForceVerifying(false);
    }
  };

  const handleUpdateInternshipStage = async (internshipId: string, stage: InternshipStage) => {
    try {
      setInternshipActionId(internshipId);
      setActionError(null);
      await api.updateInternshipStatus(internshipId, {
        verification_stage: stage,
        status: stage === "verified" ? "verified" : stage === "rejected" ? "rejected" : "pending",
      });
      setSuccessMsg(`Internship stage updated to "${stage}". Live on student mobile app!`);
      onActionComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update internship";
      setActionError(msg);
    } finally {
      setInternshipActionId(null);
    }
  };

  const handleResetBiometrics = async () => {
    if (!confirm("Are you sure you want to reset this student's face biometric enrollment? They will be required to re-capture their face.")) {
      return;
    }
    try {
      setIsResettingBio(true);
      setActionError(null);
      await api.resetBiometrics(item.user_id);
      alert("Biometrics reset successfully.");
      onActionComplete();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reset failed";
      setActionError(msg);
    } finally {
      setIsResettingBio(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white/95 sticky top-0 z-20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  Forensic Review
                </span>
                <span className="font-mono text-xs text-slate-500">
                  UID: <span className="text-slate-800 font-bold">{item.user_id.slice(0, 8)}</span>
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                {item.user_name}
                <span className="font-mono text-xs font-normal text-slate-500">
                  ({item.registration_number || "NO-ROLL"})
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Notices */}
        {successMsg && (
          <div className="mx-6 mt-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {actionError && (
          <div className="mx-6 mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Side-by-Side Content */}
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Card Viewer (Smart ID / Physical Scan) */}
          <div className="flex flex-col gap-3">
            {/* View Mode Segmented Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setCardTab("smart_card")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    cardTab === "smart_card"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                  <span>Digitized Smart ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardTab("scan")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    cardTab === "scan"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Scan className="w-3.5 h-3.5 text-slate-600" />
                  <span>Physical Document Scan</span>
                  {imageUrl ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : imageError ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  ) : null}
                </button>
              </div>

              {cardTab === "scan" && imageUrl && (
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] text-sky-600 hover:text-sky-700 flex items-center gap-1 font-bold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Resolution
                </a>
              )}

              {cardTab === "scan" && !imageUrl && !imageLoading && (
                <button
                  type="button"
                  onClick={handleRetryFetch}
                  className="font-mono text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              )}
            </div>

            {/* Tab 1: Digitized Smart ID Card */}
            {cardTab === "smart_card" && (
              <div className="flex flex-col gap-2.5">
                <SmartIdCard item={item} imageUrl={imageUrl} />
                {imageError && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Physical document file unmounted on server disk • Displaying verified roster ID
                    </span>
                    <button
                      type="button"
                      onClick={() => setCardTab("scan")}
                      className="font-bold underline hover:text-amber-900 ml-2 shrink-0"
                    >
                      Inspect Scan Feed
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Physical Document Viewfinder */}
            {cardTab === "scan" && (
              <div className="relative rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[340px] overflow-hidden group shadow-lg">
                <div className="absolute top-2.5 left-2.5 font-mono text-cyan-400/60 text-xs select-none pointer-events-none">⌜</div>
                <div className="absolute top-2.5 right-2.5 font-mono text-cyan-400/60 text-xs select-none pointer-events-none">⌝</div>
                <div className="absolute bottom-2.5 left-2.5 font-mono text-cyan-400/60 text-xs select-none pointer-events-none">⌞</div>
                <div className="absolute bottom-2.5 right-2.5 font-mono text-cyan-400/60 text-xs select-none pointer-events-none">⌟</div>

                {imageUrl && (
                  <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scanline pointer-events-none z-10 opacity-75" />
                )}

                {imageLoading ? (
                  <div className="flex flex-col items-center gap-3 text-slate-400 py-12">
                    <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
                    <span className="font-mono text-xs text-slate-300">Decrypting ID card stream...</span>
                  </div>
                ) : imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl}
                    alt="Student College ID"
                    className="w-full h-full object-contain rounded-xl max-h-[420px] p-2"
                  />
                ) : imageError ? (
                  <div className="flex flex-col items-center gap-3 p-8 text-center text-slate-400 max-w-sm">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Physical Document Unreachable</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        The physical scan image uploaded by the student is unavailable on the storage node (e.g. wiped after ephemeral instance restart).
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setCardTab("smart_card")}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold transition-colors shadow-xs"
                      >
                        View Digitized Smart ID
                      </button>
                      <button
                        type="button"
                        onClick={handleRetryFetch}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition-colors border border-slate-700"
                      >
                        Retry Scan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 p-8 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 text-slate-500" />
                    <span className="text-xs font-medium text-slate-400">No physical ID card upload on file</span>
                    <button
                      type="button"
                      onClick={() => setCardTab("smart_card")}
                      className="px-3 py-1 rounded bg-slate-800 text-sky-400 font-mono text-xs hover:bg-slate-700"
                    >
                      Open Smart ID Card
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Inspector Checklist */}
            <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <p className="font-mono text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-600" />
                Verification Checklist:
              </p>
              <ul className="space-y-1 text-[11px] text-slate-600 pl-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>Verify institutional emblem and official registrar signature</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>Cross-check full name spelling with registration profile</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>Validate academic session & enrollment roll number</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: OCR Extracted vs Registered Data */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Telemetry Comparison & Match
                </h3>
                {confidence !== null && (
                  <span
                    className={`font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                      confidence >= 80
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : confidence >= 60
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    Match: {confidence}%
                  </span>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="p-3 font-bold">Attribute</th>
                      <th className="p-3 font-bold">Registered</th>
                      <th className="p-3 font-bold">OCR Parsed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr>
                      <td className="p-3 text-slate-500 font-sans font-medium">Student Name</td>
                      <td className="p-3 font-bold text-slate-900">{item.user_name}</td>
                      <td className="p-3 text-sky-700 font-bold">
                        {fields.student_name || "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-500 font-sans font-medium">Institution</td>
                      <td className="p-3 font-bold text-slate-900">{item.college_name || "—"}</td>
                      <td className="p-3 text-sky-700 font-bold">
                        {fields.college_name || "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-500 font-sans font-medium">Registration #</td>
                      <td className="p-3 font-bold text-slate-900">{item.registration_number || "—"}</td>
                      <td className="p-3 text-sky-700 font-bold">
                        {fields.registration_number || "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-500 font-sans font-medium">Department</td>
                      <td className="p-3 text-slate-400">—</td>
                      <td className="p-3 text-sky-700 font-bold">
                        {fields.department || "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification Pipeline Telemetry Status */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">College ID Status:</span>
                <span className="font-mono text-[11px] font-bold uppercase text-amber-700">
                  {item.college_id_status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Face Biometrics:</span>
                <span className="font-mono text-[11px] font-bold uppercase text-emerald-700">
                  {item.face_status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Overall Pipeline:</span>
                <span className="font-mono text-[11px] font-bold uppercase text-sky-700">
                  {item.overall_status}
                </span>
              </div>
            </div>

            {/* Rejection Control */}
            <div className="space-y-2.5">
              <label className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-700 block">
                Flagging Justification (if rejecting):
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 transition-colors"
              >
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Or specify custom rejection reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Registered Internships Section */}
        <div className="mx-6 mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sky-600" />
              Registered Student Internships ({item.internships?.length || 0})
            </span>
            <span className="font-mono text-[10px] text-sky-700 uppercase tracking-wider font-semibold">
              Live Cloud Sync
            </span>
          </div>

          {!item.internships || item.internships.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              No internship records logged by student in mobile app.
            </p>
          ) : (
            <div className="space-y-3">
              {item.internships.map((intern) => (
                <div
                  key={intern.id}
                  className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-3 text-xs shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-sky-600" />
                        {intern.company_name}
                        {intern.is_active && (
                          <span className="font-mono text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase">
                            Active
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {intern.role} • <span className="capitalize">{intern.internship_type}</span>
                        {intern.location ? ` • ${intern.location}` : ""}
                      </p>
                    </div>

                    <span
                      className={`font-mono text-[10px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${
                        intern.verification_stage === "verified"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : intern.verification_stage === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      Stage: {intern.verification_stage.replace("_", " ")}
                    </span>
                  </div>

                  {intern.offer_letter_url && (
                    <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 w-fit">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Offer Letter / Proof Document Attached</span>
                    </div>
                  )}

                  {/* Multi-stage verification controls */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Progress Stage:
                    </span>
                    <button
                      onClick={() => handleUpdateInternshipStage(intern.id, "tp_review")}
                      disabled={internshipActionId === intern.id}
                      className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] hover:bg-blue-100 font-semibold transition-all cursor-pointer"
                    >
                      T&P Cell
                    </button>
                    <button
                      onClick={() => handleUpdateInternshipStage(intern.id, "mentor_review")}
                      disabled={internshipActionId === intern.id}
                      className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[11px] hover:bg-purple-100 font-semibold transition-all cursor-pointer"
                    >
                      Industry Mentor
                    </button>
                    <button
                      onClick={() => handleUpdateInternshipStage(intern.id, "verified")}
                      disabled={internshipActionId === intern.id}
                      className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] hover:bg-emerald-100 font-bold transition-all cursor-pointer"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleUpdateInternshipStage(intern.id, "rejected")}
                      disabled={internshipActionId === intern.id}
                      className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] hover:bg-rose-100 font-bold transition-all cursor-pointer"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Action Bar */}
        <div className="p-6 border-t border-slate-200 bg-white sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetBiometrics}
              disabled={isResettingBio || !item.has_face_embedding}
              className="px-4 py-2.5 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
            >
              {isResettingBio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Reset Biometrics
            </button>

            <button
              onClick={handleForceVerify}
              disabled={isForceVerifying || item.overall_status === "verified"}
              className="px-4 py-2.5 rounded-xl bg-sky-50 border border-sky-300 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
            >
              {isForceVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Force Verify Profile
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              disabled={isRejecting}
              className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isRejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Reject Document
            </button>

            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Approve Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
