import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "indigo" | "amber" | "emerald" | "rose" | "purple";
  badge?: string;
}

const colorStyles = {
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-400",
    glow: "group-hover:border-indigo-500/40",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    glow: "group-hover:border-amber-500/40",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    glow: "group-hover:border-emerald-500/40",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
    glow: "group-hover:border-rose-500/40",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    glow: "group-hover:border-purple-500/40",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "indigo",
  badge,
}: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={`p-5 rounded-2xl bg-slate-900 border ${styles.border} ${styles.glow} transition-all duration-200 group relative overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl ${styles.bg} ${styles.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${styles.bg} ${styles.text}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
