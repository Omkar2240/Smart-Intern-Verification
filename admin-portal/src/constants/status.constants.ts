// Verification status values
export const VERIFICATION_STATUS = {
  NOT_STARTED: "not_started",
  PENDING: "pending",
  VERIFIED: "verified",
  MANUAL_REVIEW: "manual_review",
  REJECTED: "rejected",
} as const;

// Internship pipeline stages
export const INTERNSHIP_STAGE = {
  SUBMITTED: "submitted",
  TP_REVIEW: "tp_review",
  MENTOR_REVIEW: "mentor_review",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

export const INTERNSHIP_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  NOT_STARTED: "not_started",
} as const;

// User account status
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

// Human-readable labels
export const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  pending: "Pending",
  verified: "Verified",
  manual_review: "Needs Review",
  rejected: "Rejected",
  submitted: "Submitted",
  tp_review: "T&P Review",
  mentor_review: "Mentor Review",
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
};

// Tailwind color schemes per status
export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  verified: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  manual_review: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  rejected: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  pending: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  not_started: {
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
    dot: "bg-slate-300",
  },
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  inactive: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};
