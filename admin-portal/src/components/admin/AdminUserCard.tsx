"use client";

import React from "react";
import { Mail, ShieldCheck, GraduationCap, Calendar, PowerOff, Power } from "lucide-react";
import { RoleBadge } from "./RoleBadge";
import type { AdminUserExtended } from "@/types/admin.types";

interface AdminUserCardProps {
  user: AdminUserExtended;
  onToggleStatus?: (user: AdminUserExtended) => void;
  canManage?: boolean;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const avatarGradients = [
  "from-indigo-500 to-blue-600",
  "from-sky-500 to-cyan-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
];

export function AdminUserCard({ user, onToggleStatus, canManage = false }: AdminUserCardProps) {
  const gradientClass = avatarGradients[user.id.charCodeAt(user.id.length - 1) % avatarGradients.length];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:shadow-md hover:border-sky-200 hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0`}
          >
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate leading-tight">{user.name}</p>
            <div className="mt-1">
              <RoleBadge role={user.role} size="sm" />
            </div>
          </div>
        </div>

        {/* Active/Inactive status */}
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
            user.is_active
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
          />
          {user.is_active ? "Online" : "Offline"}
        </span>
      </div>

      {/* Info rows */}
      <div className="space-y-2 text-xs mb-4">
        <div className="flex items-center gap-2 text-slate-600">
          <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="font-mono truncate">{user.email}</span>
        </div>

        {user.college_name && (
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-sky-400" />
            <span className="truncate">{user.college_name}</span>
          </div>
        )}

        {user.department_name && (
          <div className="flex items-center gap-2 text-slate-600">
            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span className="truncate">{user.department_name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-500">
          <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="font-mono text-[11px]">Last login: {formatDate(user.last_login)}</span>
        </div>
      </div>

      {/* Toggle button */}
      {canManage && onToggleStatus && (
        <button
          onClick={() => onToggleStatus(user)}
          className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            user.is_active
              ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          {user.is_active ? (
            <>
              <PowerOff className="w-3.5 h-3.5" />
              Deactivate
            </>
          ) : (
            <>
              <Power className="w-3.5 h-3.5" />
              Activate
            </>
          )}
        </button>
      )}
    </div>
  );
}
