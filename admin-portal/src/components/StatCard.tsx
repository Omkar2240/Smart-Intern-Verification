import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "indigo" | "amber" | "emerald" | "rose" | "purple" | "cyan";
  badge?: string;
}

const colorStyles = {
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    text: "text-indigo-600",
    glow: "hover:border-indigo-300 hover:shadow-indigo-500/10",
    glowBg: "from-indigo-50/60 via-transparent to-transparent",
    corner: "text-indigo-400",
  },
  cyan: {
    bg: "bg-sky-50",
    border: "border-sky-100",
    text: "text-sky-600",
    glow: "hover:border-sky-300 hover:shadow-sky-500/10",
    glowBg: "from-sky-50/60 via-transparent to-transparent",
    corner: "text-sky-400",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-600",
    glow: "hover:border-amber-300 hover:shadow-amber-500/10",
    glowBg: "from-amber-50/60 via-transparent to-transparent",
    corner: "text-amber-400",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-600",
    glow: "hover:border-emerald-300 hover:shadow-emerald-500/10",
    glowBg: "from-emerald-50/60 via-transparent to-transparent",
    corner: "text-emerald-400",
  },
  rose: {
    bg: "bg-rose-50",
    border: "border-rose-100",
    text: "text-rose-600",
    glow: "hover:border-rose-300 hover:shadow-rose-500/10",
    glowBg: "from-rose-50/60 via-transparent to-transparent",
    corner: "text-rose-400",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-100",
    text: "text-purple-600",
    glow: "hover:border-purple-300 hover:shadow-purple-500/10",
    glowBg: "from-purple-50/60 via-transparent to-transparent",
    corner: "text-purple-400",
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
  const styles = colorStyles[color] || colorStyles.indigo;

  return (
    <div
      className={`relative p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 group overflow-hidden hover:-translate-y-0.5`}
    >
      {/* Ambient gradient wash */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${styles.glowBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      />

      {/* Crosshair corner markers */}
      <div className={`absolute top-2.5 right-2.5 font-mono text-[9px] ${styles.corner} select-none`}>
        +
      </div>

      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="font-mono text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          {title}
        </span>
        <div
          className={`p-2.5 rounded-xl ${styles.bg} ${styles.text} border ${styles.border} transition-transform duration-200 group-hover:scale-110 shadow-xs`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2.5 relative z-10">
        <h3 className="font-mono text-2xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </h3>
        {badge && (
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.bg} ${styles.text} border ${styles.border} uppercase tracking-wider animate-pulse`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-2 relative z-10 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span>{subtitle}</span>
        </p>
      )}
    </div>
  );
}
