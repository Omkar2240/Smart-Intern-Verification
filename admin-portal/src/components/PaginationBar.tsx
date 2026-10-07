"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Reusable pagination bar used across all list pages.
 * Shows: "Showing X-Y of Z records" and Previous/Next controls.
 */
export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div
      className={clsx(
        "flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/40",
        className
      )}
    >
      <p className="font-mono text-[10px] text-slate-500">
        Showing{" "}
        <span className="font-bold text-slate-700">
          {from}–{to}
        </span>{" "}
        of{" "}
        <span className="font-bold text-slate-700">{total.toLocaleString()}</span>{" "}
        records
      </p>

      <div className="flex items-center gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={clsx(
            "p-1.5 rounded-lg border text-xs transition-all",
            page <= 1
              ? "opacity-40 cursor-not-allowed border-slate-200 text-slate-400"
              : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
          )}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono text-[11px] text-slate-600 px-2">
          {page} / {totalPages}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={clsx(
            "p-1.5 rounded-lg border text-xs transition-all",
            page >= totalPages
              ? "opacity-40 cursor-not-allowed border-slate-200 text-slate-400"
              : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
          )}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
