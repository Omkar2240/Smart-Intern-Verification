"use client";

import React from "react";
import { MapPin, GraduationCap, Pencil, Users, Briefcase } from "lucide-react";
import type { DepartmentWithStats } from "@/types/department.types";

interface DepartmentCardProps {
  department: DepartmentWithStats;
  onEdit?: (dept: DepartmentWithStats) => void;
  canEdit?: boolean;
}

export function DepartmentCard({ department, onEdit, canEdit = false }: DepartmentCardProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-sky-300 hover:-translate-y-0.5 transition-all duration-200 group flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 border border-sky-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 text-sky-600" />
          </div>
          <div className="min-w-0">
            {department.code && (
              <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                {department.code}
              </span>
            )}
            <h3 className="font-bold text-sm text-slate-900 tracking-tight mt-1 leading-tight">
              {department.name}
            </h3>
          </div>
        </div>

        {canEdit && onEdit && (
          <button
            onClick={() => onEdit(department)}
            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all shrink-0 cursor-pointer"
            title="Edit Department"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* College */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span className="truncate">{department.college_name}</span>
      </div>

      {/* HOD */}
      {department.hod_name && (
        <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Head of Department
          </p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">{department.hod_name}</p>
          {department.hod_email && (
            <p className="font-mono text-[11px] text-slate-500 mt-0.5">{department.hod_email}</p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
          <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold leading-none">
              Students
            </p>
            <p className="font-mono text-sm font-extrabold text-slate-900 mt-0.5">
              {department.student_count.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
          <Briefcase className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold leading-none">
              Internships
            </p>
            <p className="font-mono text-sm font-extrabold text-emerald-700 mt-0.5">
              {department.active_internships}
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            department.is_active
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${department.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
          />
          {department.is_active ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
}
