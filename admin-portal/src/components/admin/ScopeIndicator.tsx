"use client";

import React from "react";
import { Building2, GraduationCap } from "lucide-react";

interface ScopeIndicatorProps {
  collegeName?: string | null;
  departmentName?: string | null;
}

export function ScopeIndicator({ collegeName, departmentName }: ScopeIndicatorProps) {
  if (!collegeName && !departmentName) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {collegeName && (
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
          <Building2 className="w-3 h-3" />
          {collegeName}
        </span>
      )}
      {departmentName && (
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
          <GraduationCap className="w-3 h-3" />
          {departmentName}
        </span>
      )}
    </div>
  );
}
