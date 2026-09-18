"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  ZoomIn,
  ExternalLink,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { VerificationItem } from "@/types/admin";
import { api } from "@/lib/api";

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
  const [isResettingBio, setIsResettingBio] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (item && item.has_card_image && isOpen) {
      setImageLoading(true);
      api
        .getCardImageBlob(item.user_id)
        .then((url) => setImageUrl(url))
        .catch((err) => console.error("Error loading card image:", err))
        .finally(() => setImageLoading(false));
    } else {
      setImageUrl(null);
    }
  }, [item, isOpen]);

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Verification Review
              </span>
              <span className="text-xs text-slate-400">ID: {item.user_id.slice(0, 8)}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {item.user_name}{" "}
              <span className="text-sm font-normal text-slate-400">({item.registration_number})</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {actionError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Side-by-Side Content */}
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Uploaded Card Viewer */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Physical College ID Card
              </h3>
              {imageUrl && (
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full View
                </a>
              )}
            </div>

            <div className="relative rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[300px] overflow-hidden group">
              {imageLoading ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                  <span className="text-xs">Loading encrypted image...</span>
                </div>
              ) : imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl}
                  alt="Student College ID"
                  className="w-full h-full object-contain rounded-xl max-h-[420px]"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 p-8 text-center text-slate-400">
                  <ShieldAlert className="w-8 h-8 text-slate-400" />
                  <span className="text-xs font-medium">No ID card photo file uploaded yet</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
              <p className="font-semibold text-slate-300 mb-1">Inspector Guidelines:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Verify institution emblem and official stamp</li>
                <li>Check student full name spelling</li>
                <li>Confirm valid enrollment roll/registration number</li>
              </ul>
            </div>
          </div>

          {/* Right: OCR Extracted vs Registered Data */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  OCR Extracted vs Registered Data
                </h3>
                {confidence !== null && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      confidence >= 80
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : confidence >= 60
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    }`}
                  >
                    Match: {confidence}%
                  </span>
                )}
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-2.5 font-semibold">Field</th>
                      <th className="p-2.5 font-semibold">User Profile</th>
                      <th className="p-2.5 font-semibold">OCR Extracted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-medium text-slate-400">Student Name</td>
                      <td className="p-2.5 font-semibold text-white">{item.user_name}</td>
                      <td className="p-2.5 text-indigo-300">
                        {fields.student_name || "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-slate-400">College</td>
                      <td className="p-2.5 font-semibold text-white">{item.college_name || "—"}</td>
                      <td className="p-2.5 text-indigo-300">
                        {fields.college_name || "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-slate-400">Registration #</td>
                      <td className="p-2.5 font-semibold text-white">{item.registration_number}</td>
                      <td className="p-2.5 text-indigo-300">
                        {fields.registration_number || "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-slate-400">Department</td>
                      <td className="p-2.5 text-slate-400">—</td>
                      <td className="p-2.5 text-indigo-300">
                        {fields.department || "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification Status Overview */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">College ID Status:</span>
                <span className="font-semibold capitalize text-amber-400">{item.college_id_status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Face Biometric Status:</span>
                <span className="font-semibold capitalize text-emerald-400">{item.face_status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Overall Verification:</span>
                <span className="font-semibold capitalize text-indigo-400">{item.overall_status}</span>
              </div>
            </div>

            {/* Rejection Panel */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Rejection Reason (if rejecting):
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Or type custom rejection reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/90 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleResetBiometrics}
            disabled={isResettingBio || !item.has_face_embedding}
            className="px-3.5 py-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            {isResettingBio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Reset Biometrics
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              disabled={isRejecting}
              className="px-4 py-2 rounded-lg bg-rose-600/15 border border-rose-500/30 text-rose-400 hover:bg-rose-600/25 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isRejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Reject Document
            </button>

            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Approve Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
