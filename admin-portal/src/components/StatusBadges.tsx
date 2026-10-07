"use client";

import { clsx } from "clsx";

// ─── Verification Status Badge ────────────────────────────────────────────────

const VERIFICATION_STATUS_CONFIG: Record<
  string,
  { label: string; cls: string }
> = {
  verified: {
    label: "Verified",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: "Pending",
    cls: "bg-slate-50 text-slate-600 border-slate-200",
  },
  manual_review: {
    label: "Needs Review",
    cls: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
  },
  not_started: {
    label: "Not Started",
    cls: "bg-slate-50 text-slate-500 border-slate-200",
  },
};

export function VerificationStatusBadge({ status }: { status: string }) {
  const cfg =
    VERIFICATION_STATUS_CONFIG[status] ||
    VERIFICATION_STATUS_CONFIG.pending;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border",
        cfg.cls
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

// ─── Internship Stage Badge ───────────────────────────────────────────────────

const INTERNSHIP_STAGE_CONFIG: Record<string, { label: string; cls: string }> =
  {
    submitted: {
      label: "Submitted",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    tp_review: {
      label: "TP Review",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    mentor_review: {
      label: "Mentor Review",
      cls: "bg-purple-50 text-purple-700 border-purple-200",
    },
    verified: {
      label: "Verified",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-rose-50 text-rose-700 border-rose-200",
    },
  };

export function InternshipStageBadge({ stage }: { stage: string }) {
  const cfg =
    INTERNSHIP_STAGE_CONFIG[stage] || INTERNSHIP_STAGE_CONFIG.submitted;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border",
        cfg.cls
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

// ─── Active / Inactive Badge ──────────────────────────────────────────────────

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-rose-50 text-rose-700 border-rose-200"
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Attendance Status Badge ──────────────────────────────────────────────────

const ATTENDANCE_STATUS_CONFIG: Record<string, { label: string; cls: string }> =
  {
    present: {
      label: "Present",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    absent: {
      label: "Absent",
      cls: "bg-rose-50 text-rose-700 border-rose-200",
    },
    late: {
      label: "Late",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
  };

export function AttendanceStatusBadge({ status }: { status: string }) {
  const cfg =
    ATTENDANCE_STATUS_CONFIG[status] || ATTENDANCE_STATUS_CONFIG.absent;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border",
        cfg.cls
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}
