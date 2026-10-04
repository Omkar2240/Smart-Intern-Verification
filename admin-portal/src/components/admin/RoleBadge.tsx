"use client";

import React from "react";
import { Shield, Building2, GraduationCap } from "lucide-react";
import { ROLE_COLORS, ROLE_LABELS } from "@/constants/roles.constants";
import type { AdminRole } from "@/types/admin.types";

interface RoleBadgeProps {
  role: AdminRole | string;
  size?: "sm" | "md";
}

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  super_admin: Shield,
  college_admin: Building2,
  department_admin: GraduationCap,
};

export function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  const colors = ROLE_COLORS[role] || ROLE_COLORS.student;
  const label = ROLE_LABELS[role] || role;
  const Icon = roleIcons[role];

  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider rounded-lg border ${textSize} ${padding} ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {Icon && <Icon className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} ${colors.icon}`} />}
      {label}
    </span>
  );
}
