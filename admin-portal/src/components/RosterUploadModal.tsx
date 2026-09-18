"use client";

import React, { useState } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { College } from "@/types/admin";
import { api } from "@/lib/api";

interface RosterUploadModalProps {
  college: College | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RosterUploadModal({
  college,
  isOpen,
  onClose,
  onSuccess,
}: RosterUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    added: number;
    skipped: number;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !college) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const res = await api.uploadRoster(college.id, file);
      setResult({
        added: res.added_count,
        skipped: res.skipped_count,
        message: res.message,
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Import Student Whitelist Roster</h3>
            <p className="text-xs text-slate-400 mt-0.5">{college.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <div className="text-xs text-slate-400 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <p className="font-semibold text-slate-200">CSV Header Requirements:</p>
            <p className="font-mono text-indigo-300">student_name, registration_number, email, department</p>
            <p className="text-[11px] text-slate-400">
              Students on this list will have their roll numbers automatically matched during OCR verification.
            </p>
          </div>

          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/50 transition-colors">
            <UploadCloud className="w-8 h-8 text-indigo-400" />
            <span className="text-xs font-semibold text-white">
              {file ? file.name : "Click to select CSV file"}
            </span>
            <span className="text-[11px] text-slate-400">Supported formats: .csv</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{result.message}</p>
                <p className="text-[11px] text-emerald-300 mt-0.5">
                  Added: {result.added} | Skipped/Duplicate: {result.skipped}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !file}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isUploading ? "Uploading..." : "Import Roster"}
          </button>
        </div>
      </div>
    </div>
  );
}
