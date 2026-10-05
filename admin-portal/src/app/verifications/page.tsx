"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { ReviewDrawer } from "@/components/ReviewDrawer";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { api } from "@/lib/api";
import { VerificationItem } from "@/types/admin";
import { clsx } from "clsx";
import { mockStudents } from "@/data/mock/students.mock";

// Helper to convert mock students to VerificationItem format
function mockToVerificationItem(
  mock: (typeof mockStudents)[0],
): VerificationItem {
  return {
    user_id: mock.id,
    user_name: mock.name,
    user_email: mock.email,
    registration_number: mock.registration_number,
    mobile_number: mock.mobile_number,
    college_id: mock.college_id,
    college_name: mock.college_name,
    college_status: "active",
    college_id_status: mock.verification_status,
    face_status:
      mock.verification_status === "verified"
        ? "verified"
        : mock.verification_status === "rejected"
          ? "rejected"
          : mock.verification_status === "manual_review"
            ? "manual_review"
            : "pending",
    overall_status: mock.verification_status,
    extracted_metadata: {
      fields: {
        student_name: mock.name,
        college_name: mock.college_name,
        registration_number: mock.registration_number,
        department: mock.department_name,
      },
      verification: {
        confidence_score:
          mock.verification_status === "verified"
            ? 85 + Math.random() * 10
            : mock.verification_status === "manual_review"
              ? 45 + Math.random() * 20
              : mock.verification_status === "rejected"
                ? 20 + Math.random() * 30
                : null,
      },
    },
    has_card_image: true,
    has_face_embedding: mock.verification_status === "verified",
    is_verified: mock.is_verified,
    created_at: mock.created_at,
    verified_at: mock.verified_at,
  };
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; cls: string }> = {
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
  const cfg = configs[status] || configs.pending;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border",
        cfg.cls,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

export default function VerificationsPage() {
  const { user } = useAdminAuth();
  const role = user?.role || "department_admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(
    null,
  );
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVerifications();
  }, [statusFilter, search]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getVerifications({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
      });
      setVerifications(response.items);
    } catch (err: unknown) {
      // Fallback to mock data if API fails (e.g., 401 unauthorized)
      console.log("API failed, using mock data:", err);
      const mockItems = mockStudents.map(mockToVerificationItem);
      setVerifications(mockItems);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = verifications;

    // Apply role-based filtering
    if (role === "college_admin" && user?.college_id) {
      result = result.filter((v) => v.college_id === user.college_id);
    }

    // Apply search filter (in case API doesn't support it)
    if (search) {
      result = result.filter(
        (v) =>
          v.user_name.toLowerCase().includes(search.toLowerCase()) ||
          v.registration_number.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return result;
  }, [verifications, search, role, user]);

  const verified = filtered.filter(
    (v) => v.overall_status === "verified",
  ).length;
  const pending = filtered.filter(
    (v) =>
      v.overall_status === "pending" || v.overall_status === "manual_review",
  ).length;
  const rejected = filtered.filter(
    (v) => v.overall_status === "rejected",
  ).length;
  const needsReview = filtered.filter(
    (v) => v.overall_status === "manual_review",
  ).length;

  const handleActionComplete = () => {
    loadVerifications();
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar pendingReviewCount={needsReview} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Verification Center"
          description={
            role === "super_admin"
              ? "Platform-wide identity verification queue"
              : role === "college_admin"
                ? "Identity verification — Your college"
                : "Identity verification — Your department"
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                title: "Total Submissions",
                value: filtered.length,
                icon: ShieldCheck,
                color: "cyan" as const,
              },
              {
                title: "Verified",
                value: verified,
                icon: CheckCircle2,
                color: "emerald" as const,
              },
              {
                title: "Needs Review",
                value: needsReview,
                icon: AlertTriangle,
                color: "amber" as const,
                badge: needsReview > 0 ? "Action" : undefined,
              },
              {
                title: "Rejected",
                value: rejected,
                icon: XCircle,
                color: "rose" as const,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
          >
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                    Identity Verification Queue
                    <span className="font-mono text-[10px] bg-white text-sky-700 border border-slate-200 font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {filtered.length} records
                    </span>
                  </h3>
                  <p className="font-mono text-[10px] text-slate-500">
                    OCR parsing, face embeddings, institutional whitelist
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by name, roll #..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-52 transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Submissions</option>
                  <option value="manual_review">Needs Review</option>
                  <option value="verified">Verified Only</option>
                  <option value="rejected">Rejected Only</option>
                  <option value="pending">Pending</option>
                  <option value="not_started">Not Started</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {[
                      "Student Name",
                      "Enrollment/PRN",
                      "Email",
                      "Institution",
                      "College ID Status",
                      "Face Biometrics",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-16 text-center text-slate-500"
                      >
                        <Loader2 className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-spin" />
                        <p className="text-sm font-semibold">
                          Loading verifications...
                        </p>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-16 text-center text-slate-500"
                      >
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-300" />
                        <p className="text-sm font-semibold text-rose-600">
                          {error}
                        </p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-16 text-center text-slate-500"
                      >
                        <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold">
                          No verification records
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item, idx) => (
                      <motion.tr
                        key={item.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-100 border border-sky-200 font-bold text-[11px] text-sky-700 flex items-center justify-center shrink-0">
                              {item.user_name[0]}
                            </div>
                            <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                              {item.user_name}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-mono text-[10px] text-slate-600">
                            {item.registration_number || "—"}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-[11px] text-slate-600 line-clamp-1">
                            {item.user_email}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          <p className="text-[11px] line-clamp-1">
                            {item.college_name || "—"}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={item.college_id_status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={item.face_status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                            >
                              <Eye className="w-3 h-3" /> Inspect
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Review Drawer */}
      <ReviewDrawer
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}
