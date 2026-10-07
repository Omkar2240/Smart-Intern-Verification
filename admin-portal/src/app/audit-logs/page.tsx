"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText, Search, Download, Filter, AlertTriangle,
  CheckCircle2, Eye, Info
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { mockAuditLogs } from "@/data/mock/auditLogs.mock";
import { ROLE_LABELS, ROLE_COLORS } from "@/constants/roles.constants";
import { clsx } from "clsx";

const actionIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  CREATE_COLLEGE: { icon: CheckCircle2, color: "text-emerald-600" },
  CREATE_COLLEGE_ADMIN: { icon: CheckCircle2, color: "text-emerald-600" },
  APPROVE_VERIFICATION: { icon: CheckCircle2, color: "text-emerald-600" },
  REJECT_INTERNSHIP: { icon: AlertTriangle, color: "text-amber-600" },
  DEACTIVATE_COLLEGE: { icon: AlertTriangle, color: "text-amber-600" },
  RESET_BIOMETRICS: { icon: CheckCircle2, color: "text-sky-600" },
  UPDATE_INTERNSHIP_STAGE: { icon: Info, color: "text-sky-600" },
  UPLOAD_ROSTER: { icon: CheckCircle2, color: "text-emerald-600" },
};

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AuditLogsPage() {
  const { user } = useAdminAuth();
  const role = user?.role || "super_admin";

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<(typeof mockAuditLogs)[0] | null>(null);

  // Role-based: only super_admin sees all logs; college/dept admins see their own
  const roleLogs = useMemo(() => {
    if (role === "super_admin" || role === "admin") return mockAuditLogs;
    if (role === "college_admin") return mockAuditLogs.filter(l => l.admin_role !== "super_admin");
    return mockAuditLogs.filter(l => l.admin_role === "department_admin");
  }, [role]);

  const filtered = useMemo(() => roleLogs.filter(l => {
    const matchSearch = !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.admin_name.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || l.status === actionFilter;
    const matchRole = roleFilter === "all" || l.admin_role === roleFilter;
    return matchSearch && matchAction && matchRole;
  }), [roleLogs, search, actionFilter, roleFilter]);

  const successCount = roleLogs.filter(l => l.status === "success").length;
  const warningCount = roleLogs.filter(l => l.status === "warning").length;
  const errorCount = roleLogs.filter(l => l.status === "error").length;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={role === "department_admin" ? "Department Reports" : role === "college_admin" ? "College Reports" : "Audit Logs"}
          description="Complete trail of all admin actions"
          actions={
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Successful", count: successCount, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
              { label: "Warnings", count: warningCount, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
              { label: "Errors", count: errorCount, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={clsx("rounded-2xl border p-4 flex items-center gap-3", s.bg, s.border)}
              >
                <div className={clsx("w-2.5 h-2.5 rounded-full", s.dot)} />
                <div>
                  <p className={clsx("text-xl font-extrabold tabular-nums", s.color)}>{s.count}</p>
                  <p className="font-mono text-[10px] text-slate-500 uppercase">{s.label}</p>
                </div>
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
                <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Activity Log</h3>
                  <p className="font-mono text-[10px] text-slate-500">{filtered.length} entries</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-48 transition-all"
                  />
                </div>
                <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none">
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
                {(role === "super_admin" || role === "admin") && (
                  <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none">
                    <option value="all">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="college_admin">College Admin</option>
                    <option value="department_admin">Dept. Admin</option>
                  </select>
                )}
              </div>
            </div>

            {/* Log Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {["Timestamp", "Admin", "Action", "Details", "IP Address", "Status"].map(col => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold">No log entries</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((log, idx) => {
                      const roleColor = ROLE_COLORS[log.admin_role];
                      const iconCfg = actionIcons[log.action] || { icon: Info, color: "text-slate-500" };
                      const ActionIcon = iconCfg.icon;
                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => setSelectedLog(log)}
                        >
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold border", roleColor?.bg, roleColor?.border, roleColor?.text)}>
                                {log.admin_name[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{log.admin_name}</p>
                                <span className={clsx("font-mono text-[8px] font-bold", roleColor?.text)}>
                                  {ROLE_LABELS[log.admin_role] || log.admin_role}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <ActionIcon className={clsx("w-3.5 h-3.5 shrink-0", iconCfg.color)} />
                              <span className="font-mono text-[10px] font-bold text-slate-700 whitespace-nowrap">
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="text-[11px] text-slate-600 max-w-xs truncate">{log.details}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">{log.ip_address}</td>
                          <td className="py-3.5 px-4">
                            <span className={clsx(
                              "font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border",
                              log.status === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              log.status === "warning" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Log Detail Panel */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-end p-4" onClick={() => setSelectedLog(null)}>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm h-fit"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all">×</button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Action", value: selectedLog.action.replace(/_/g, " ") },
                { label: "Admin", value: selectedLog.admin_name },
                { label: "Role", value: ROLE_LABELS[selectedLog.admin_role] || selectedLog.admin_role },
                { label: "Entity", value: `${selectedLog.target_entity} · ${selectedLog.target_id}` },
                { label: "IP Address", value: selectedLog.ip_address },
                { label: "Timestamp", value: formatTimestamp(selectedLog.timestamp) },
                { label: "Details", value: selectedLog.details },
              ].map(item => (
                <div key={item.label}>
                  <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className="text-[12px] text-slate-900 font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
