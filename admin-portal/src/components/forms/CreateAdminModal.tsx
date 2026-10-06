"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Loader2, AlertCircle } from "lucide-react";
import { mockApi } from "@/lib/mockApi";
import type { AdminUserCreate, AdminRole } from "@/types/admin.types";
import type { College } from "@/types/admin";
import type { DepartmentWithStats } from "@/types/department.types";
import { FIELD_LENGTHS } from "@/constants/validation.constants";
import { ROLE_LABELS } from "@/constants/roles.constants";

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Role of the person creating the admin */
  creatorRole: string;
  colleges: College[];
  /** If provided, pre-selects college (for college admins) */
  lockedCollegeId?: string;
}

export function CreateAdminModal({
  isOpen,
  onClose,
  onSuccess,
  creatorRole,
  colleges,
  lockedCollegeId,
}: CreateAdminModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>(
    creatorRole === "super_admin" ? "college_admin" : "department_admin",
  );
  const [collegeId, setCollegeId] = useState(lockedCollegeId || "");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load departments when college changes
  useEffect(() => {
    if (collegeId) {
      mockApi
        .getDepartments(collegeId)
        .then(setDepartments)
        .catch(console.error);
    } else {
      setDepartments([]);
      setDepartmentId("");
    }
  }, [collegeId]);

  if (!isOpen) return null;

  const handleClose = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole(
      creatorRole === "super_admin" ? "college_admin" : "department_admin",
    );
    setCollegeId(lockedCollegeId || "");
    setDepartmentId("");
    setDepartments([]);
    setError(null);
    onClose();
  };

  const validate = (): string | null => {
    if (!name.trim() || name.trim().length < 2)
      return "Name must be at least 2 characters.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email.";
    if (password.length < FIELD_LENGTHS.PASSWORD_MIN)
      return `Password must be at least ${FIELD_LENGTHS.PASSWORD_MIN} characters.`;
    if (!collegeId) return "Please select a college.";
    if (role === "department_admin" && !departmentId)
      return "Please select a department for department admin.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const payload: AdminUserCreate = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        college_id: collegeId || null,
        department_id:
          role === "department_admin" ? departmentId || null : null,
      };
      await mockApi.createAdminUser(payload);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showRoleDropdown = creatorRole === "super_admin";
  const showDeptDropdown = role === "department_admin";

  // Selectable roles based on creator
  const creatableRoles: { value: AdminRole; label: string }[] =
    creatorRole === "super_admin"
      ? [
          { value: "college_admin", label: ROLE_LABELS.college_admin },
          { value: "department_admin", label: ROLE_LABELS.department_admin },
        ]
      : [{ value: "department_admin", label: ROLE_LABELS.department_admin }];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Create Admin
              </h3>
              <p className="text-[11px] text-slate-500">
                Assign a new admin to your hierarchy
              </p>
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

          {/* Name */}
          <div>
            <label className="font-mono text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all shadow-xs"
            />
          </div>

          {/* Email */}
          <div>
            <label className="font-mono text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="admin@college.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all shadow-xs"
            />
          </div>

          {/* Password */}
          <div>
            <label className="font-mono text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              placeholder={`Min. ${FIELD_LENGTHS.PASSWORD_MIN} characters`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all shadow-xs"
            />
          </div>

          {/* Role Dropdown (only for super admin) */}
          {showRoleDropdown && (
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Admin Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as AdminRole);
                  setDepartmentId("");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all shadow-xs"
              >
                {creatableRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
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
                onChange={(e) => {
                  setCollegeId(e.target.value);
                  setDepartmentId("");
                }}
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

          {/* Department Dropdown (only for department_admin) */}
          {showDeptDropdown && (
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={!collegeId || departments.length === 0}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!collegeId
                    ? "Select college first..."
                    : departments.length === 0
                      ? "No departments found..."
                      : "Select a department..."}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.code ? `(${d.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? "Creating..." : "Create Admin"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
