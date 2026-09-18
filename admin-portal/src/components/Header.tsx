"use client";

import React from "react";
import { Bell, Search, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

export function Header({ title, description }: { title: string; description?: string }) {
  const { user } = useAdminAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">{title}</h2>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Verification Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Live API Connected</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>{user?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
