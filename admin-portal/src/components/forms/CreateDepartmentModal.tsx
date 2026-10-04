"use client";

import React, { useState } from "react";
import { X, GraduationCap, Loader2, AlertCircle } from "lucide-react";
import { mockApi } from "@/lib/mockApi";
import type { DepartmentCreate } from "@/types/department.types";
import type { College } from "@/types/admin";
import { FIELD_LENGTHS, ERROR_MESSAGES } from "@/constants/validation.constants";

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  colleges: College[];
  /** If provided, pre-selects college and hides dropdown (for college admins) */
  lockedCollegeId?: string;
}

export function CreateDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  colleges,
  lockedCollegeId,
}: CreateDepartmentModalProps) {
  const [collegeId, setCollegeId] = useState(lockedCollegeId || "");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [hodName, setHodName] = useState("");
  const [hodEmail, setHodEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setCollegeId(lockedCollegeId || "");
    setName("");
    setCode("");
    setHodName("");
    setHodEmail("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!collegeId) { setError(ERROR_MESSAGES.college.required); return; }
    if (!name.trim() || name.trim().length < FIELD_LENGTHS.DEPARTMENT_NAME_MIN) {
      setError(ERROR_MESSAGES.department.name_min);
      return;
    }
    if (hodEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hodEmail)) {
      setError("Please enter a valid HOD email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: DepartmentCreate = {
        college_id: collegeId,
        name: name.trim(),
        code: code.trim().toUpperCase() || undefined,
        hod_name: hodName.trim() || undefined,
        hod_email: hodEmail.trim() || undefined,
      };
      await mockApi.createDepartment(payload);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create department.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Create Department</h3>
              <p className="text-[11px] text-slate-500">Add a new department to a college</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* College Dropdown */}
          {!lockedCollegeId && (
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-slate-700 block mb-1">
                College <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all shadow-xs"
              >
                <option value="">Select a college...</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Name */}
          <div>
            <label className="font-mono text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Computer Science & Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all shadow-xs"
            />
          </div>

          {/* Department Code */}
          <div>
            <label className="font-mono text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Department Code
            </label>
            <input
              type="text"
              placeholder="e.g. CSE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 uppercase font-mono transition-all shadow-xs"
            />
          </div>

          {/* HOD Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-slate-700 block mb-1">
                HOD Name
              </label>
              <input
                type="text"
                placeholder="Dr. Full Name"
                value={hodName}
                onChange={(e) => setHodName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 transition-all shadow-xs"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-slate-700 block mb-1">
                HOD Email
              </label>
              <input
                type="email"
                placeholder="hod@college.ac.in"
                value={hodEmail}
                onChange={(e) => setHodEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-sky-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? "Creating..." : "Create Department"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
