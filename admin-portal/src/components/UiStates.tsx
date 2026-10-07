"use client";

import { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "py-16 text-center text-slate-500 flex flex-col items-center gap-2",
        className
      )}
    >
      <Icon className="w-8 h-8 text-slate-300" />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="text-xs text-slate-400 max-w-xs">{description}</p>
      )}
    </div>
  );
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={clsx(
                "h-4 rounded animate-shimmer",
                j === 0 ? "w-40" : j === cols - 1 ? "w-24" : "flex-1"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="m-4 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4">
      <p className="text-sm text-rose-700 font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-all shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── Page Loading ─────────────────────────────────────────────────────────────

export function PageLoading() {
  return (
    <div className="flex-1 p-6 space-y-5">
      {/* Stats skeleton */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl animate-shimmer border border-slate-200"
          />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="h-14 animate-shimmer border-b border-slate-200" />
        <TableSkeleton />
      </div>
    </div>
  );
}
