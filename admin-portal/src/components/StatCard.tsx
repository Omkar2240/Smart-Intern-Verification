"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { clsx } from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?:
    | "cyan"
    | "emerald"
    | "amber"
    | "rose"
    | "indigo"
    | "purple"
    | "violet";
  change?: number;
  trend?: "up" | "down" | "neutral";
  badge?: string;
  className?: string;
  animate?: boolean;
}

const colorMap: Record<
  string,
  { bg: string; icon: string; badge: string; border: string; glow: string }
> = {
  cyan: {
    bg: "bg-cyan-50",
    icon: "text-cyan-600",
    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
    border: "border-cyan-200/60",
    glow: "shadow-cyan-100",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    border: "border-emerald-200/60",
    glow: "shadow-emerald-100",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    border: "border-amber-200/60",
    glow: "shadow-amber-100",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "text-rose-600",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    border: "border-rose-200/60",
    glow: "shadow-rose-100",
  },
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    border: "border-indigo-200/60",
    glow: "shadow-indigo-100",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    border: "border-purple-200/60",
    glow: "shadow-purple-100",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    border: "border-violet-200/60",
    glow: "shadow-violet-100",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "cyan",
  change,
  trend,
  badge,
  className,
  animate = true,
}: StatCardProps) {
  const colors = colorMap[color] || colorMap.cyan;

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
        ? "text-rose-600"
        : "text-slate-500";

  const Card = animate ? motion.div : "div";
  const animProps = animate
    ? {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
        whileHover: { y: -2, transition: { duration: 0.2 } },
      }
    : {};

  return (
    <Card
      {...(animate ? animProps : {})}
      className={clsx(
        "relative bg-white rounded-2xl border p-5 overflow-hidden group cursor-default",
        "transition-all duration-200 hover:shadow-lg",
        colors.border,
        colors.glow,
        className,
      )}
    >
      {/* Background glow */}
      <div
        className={clsx(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
          colors.bg,
        )}
        style={{ opacity: 0.03 }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm",
            colors.bg,
            colors.border,
          )}
        >
          <Icon className={clsx("w-5 h-5", colors.icon)} />
        </div>

        {badge && (
          <span
            className={clsx(
              "font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border",
              colors.badge,
            )}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-xs font-semibold text-slate-600 tracking-tight">
          {title}
        </p>
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-mono truncate">
            {subtitle}
          </p>
        )}
      </div>

      {change !== undefined && trend && (
        <div className="mt-3 flex items-center gap-1">
          <TrendIcon className={clsx("w-3.5 h-3.5", trendColor)} />
          <span className={clsx("text-[11px] font-bold font-mono", trendColor)}>
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          <span className="text-[10px] text-slate-400">vs last month</span>
        </div>
      )}

      {/* Bottom gradient line */}
      <div
        className={clsx(
          "absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity",
          `bg-gradient-to-r from-transparent via-current to-transparent`,
          colors.icon,
        )}
      />
    </Card>
  );
}
