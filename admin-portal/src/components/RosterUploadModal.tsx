"use client";

import React, { useState } from "react";
import { X, UploadCloud, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react";
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Import Student Whitelist Roster</h3>
              <p className="text-xs text-sky-700 font-semibold mt-0.5">{college.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-mono text-[10px] uppercase font-bold text-slate-700">CSV Header Specification:</p>
            <p className="font-mono text-sky-700 font-bold bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
              student_name, registration_number, email, department
            </p>
            <p className="text-[11px] text-slate-500">
              Students in this institutional list are automatically verified against physical ID card OCR recognition.
            </p>
          </div>

          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-7 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 transition-all hover:bg-sky-50/30 group">
            <div className="p-3 rounded-xl bg-sky-100 text-sky-600 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 text-center">
              {file ? file.name : "Click or drag CSV roster file"}
            </span>
            <span className="font-mono text-[10px] text-slate-400">File format: .csv (UTF-8)</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-bold">{result.message}</p>
                <p className="font-mono text-[11px] text-emerald-700 mt-0.5">
                  Added: {result.added} records | Skipped/Duplicate: {result.skipped}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !file}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-sky-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isUploading ? "Processing CSV..." : "Import Roster"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
