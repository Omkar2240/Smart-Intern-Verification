"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Filter, User, Clock, Tag } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { PaginationBar } from "@/components/PaginationBar";
import { TableSkeleton, ErrorBanner, EmptyState } from "@/components/UiStates";
import { useDebounce } from "@/hooks/useDebounce";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { AuditLogListResponse } from "@/types/admin";
import { clsx } from "clsx";

interface Props {
  initialData: AuditLogListResponse | null;
}

const ACTION_COLORS: Record<string, string> = {
  approve: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reject: "bg-rose-50 text-rose-700 border-rose-200",
  create: "bg-blue-50 text-blue-700 border-blue-200",
  update: "bg-amber-50 text-amber-700 border-amber-200",
  delete: "bg-red-50 text-red-700 border-red-200",
  reset: "bg-purple-50 text-purple-700 border-purple-200",
};

const ENTITY_COLORS: Record<string, string> = {
  verification: "bg-sky-50 text-sky-700 border-sky-200",
  internship: "bg-indigo-50 text-indigo-700 border-indigo-200",
  college: "bg-teal-50 text-teal-700 border-teal-200",
  department: "bg-emerald-50 text-emerald-700 border-emerald-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
};

export function AuditLogsClient({ initialData }: Props) {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, loading, error, refetch } = useApi(
    () => api.getAuditLogs({
      action: actionFilter === "all" ? undefined : actionFilter,
      entity_type: entityFilter === "all" ? undefined : entityFilter,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      page, page_size: 20,
    }),
    [actionFilter, entityFilter, startDate, endDate, page],
  );

  const items = data?.items ?? initialData?.items ?? [];
  const total = data?.total ?? initialData?.total ?? 0;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Audit Logs"
          description="Security monitoring — full admin activity history"
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
          >
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200"><FileText className="w-4 h-4 text-slate-600" /></div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Admin Activity Log</h3>
                  <p className="font-mono text-[10px] text-slate-500">{total.toLocaleString()} entries</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Actions</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="reset">Reset</option>
                </select>
                <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Entities</option>
                  <option value="verification">Verification</option>
                  <option value="internship">Internship</option>
                  <option value="college">College</option>
                  <option value="department">Department</option>
                  <option value="admin">Admin</option>
                </select>
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-sky-500"
                />
                <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {error && <ErrorBanner message={error} onRetry={refetch} />}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {["Admin", "Action", "Entity", "Details", "IP Address", "Timestamp"].map((col) => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6}><TableSkeleton rows={10} cols={6} /></td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={6}><EmptyState icon={FileText} title="No audit logs found" description="No activity matches your current filters." /></td></tr>
                  ) : (
                    items.map((log, idx) => (
                      <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                              {log.admin_name?.[0]?.toUpperCase() ?? "A"}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-[11px]">{log.admin_name}</p>
                              <p className="font-mono text-[9px] text-slate-500">{log.admin_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={clsx("font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize",
                            ACTION_COLORS[log.action] ?? "bg-slate-50 text-slate-600 border-slate-200"
                          )}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={clsx("font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize",
                            ENTITY_COLORS[log.entity_type] ?? "bg-slate-50 text-slate-600 border-slate-200"
                          )}>
                            {log.entity_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-600 max-w-xs">
                          {log.details
                            ? Object.entries(log.details as Record<string, string>).slice(0, 2).map(([k, v]) => (
                              <span key={k} className="font-mono text-[9px] text-slate-500">{k}: {String(v).slice(0, 30)} </span>
                            ))
                            : "—"
                          }
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">{log.ip_address ?? "—"}</td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                          {new Date(log.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar page={page} pageSize={20} total={total} onPageChange={setPage} />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
