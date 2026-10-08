"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Search, Plus, Edit, Power, X, Loader2, CheckCircle2, MapPin, Upload,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { PaginationBar } from "@/components/PaginationBar";
import { TableSkeleton, ErrorBanner, EmptyState } from "@/components/UiStates";
import { ActiveBadge } from "@/components/StatusBadges";
import { RosterUploadModal } from "@/components/RosterUploadModal";
import { useDebounce } from "@/hooks/useDebounce";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { CollegeListResponse, College, CreateCollegePayload, UpdateCollegePayload } from "@/types/admin";
import { clsx } from "clsx";

interface Props {
  initialData: CollegeListResponse | null;
}

const EMPTY_FORM: CreateCollegePayload = {
  name: "", code: "", city: "", state: "", country: "India",
};

export function CollegesClient({ initialData }: Props) {
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editCollege, setEditCollege] = useState<College | null>(null);
  const [form, setForm] = useState<CreateCollegePayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [rosterCollegeId, setRosterCollegeId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const { data, loading, error, refetch } = useApi(
    () => api.getAdminColleges({
      search: debouncedSearch || undefined,
      include_inactive: includeInactive,
      page, page_size: 20,
    }),
    [debouncedSearch, includeInactive, page],
  );

  const items = data?.items ?? initialData?.items ?? [];
  const total = data?.total ?? initialData?.total ?? 0;
  const active = items.filter((c) => c.is_active).length;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditCollege(null);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (college: College) => {
    setForm({ name: college.name, code: college.code ?? "", city: college.city, state: college.state, country: college.country });
    setEditCollege(college);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.city || !form.state) {
      setFormError("Name, code, city and state are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editCollege) {
        await api.updateCollege(editCollege.id, form as UpdateCollegePayload);
      } else {
        await api.createCollege(form);
      }
      await refetch();
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save college");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (college: College) => {
    setTogglingId(college.id);
    try {
      await api.updateCollege(college.id, { is_active: !college.is_active });
      await refetch();
    } catch { /* ignore */ }
    finally { setTogglingId(null); }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="College Management"
          description="Manage registered colleges and upload student rosters"
          actions={
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add College
            </button>
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { title: "Total Colleges", value: total, icon: Building2, color: "cyan" as const },
              { title: "Active", value: active, icon: CheckCircle2, color: "emerald" as const },
              { title: "Inactive", value: total - active, icon: Building2, color: "rose" as const },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
          >
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-1.5 rounded-lg bg-cyan-50 border border-cyan-200"><Building2 className="w-4 h-4 text-cyan-600" /></div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">College Directory</h3>
                  <p className="font-mono text-[10px] text-slate-500">{total.toLocaleString()} colleges</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search colleges..." value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-48 transition-all"
                  />
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 font-medium">
                  <input type="checkbox" checked={includeInactive} onChange={(e) => { setIncludeInactive(e.target.checked); setPage(1); }}
                    className="w-3.5 h-3.5 rounded accent-sky-600"
                  />
                  Show Inactive
                </label>
              </div>
            </div>

            {error && <ErrorBanner message={error} onRetry={refetch} />}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {["College", "Code", "Location", "Status", "Created", "Actions"].map((col) => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6}><TableSkeleton rows={8} cols={6} /></td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={6}><EmptyState icon={Building2} title="No colleges found" /></td></tr>
                  ) : (
                    items.map((college, idx) => (
                      <motion.tr key={college.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-50 to-sky-100 border border-sky-200 font-bold text-[11px] text-sky-700 flex items-center justify-center shrink-0">
                              {college.name[0]}
                            </div>
                            <p className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{college.name}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700">
                            {college.code ?? "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-[11px] text-slate-600">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {college.city}, {college.state}
                          </div>
                        </td>
                        <td className="py-3.5 px-4"><ActiveBadge isActive={college.is_active} /></td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                          {college.created_at ? new Date(college.created_at).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(college)}
                              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-600 transition-all" title="Edit">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setRosterCollegeId(college.id)}
                              className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-600 transition-all" title="Upload Roster">
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleToggle(college)} disabled={togglingId === college.id}
                              className={clsx("p-1.5 rounded-lg border transition-all disabled:opacity-40",
                                college.is_active
                                  ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
                                  : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600"
                              )} title={college.is_active ? "Deactivate" : "Activate"}>
                              {togglingId === college.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                            </button>
                          </div>
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

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{editCollege ? "Edit College" : "Add New College"}</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <p className="text-[11px] text-rose-700">{formError}</p>
                  </div>
                )}
                {[
                  { label: "College Name *", key: "name", placeholder: "G. H. Raisoni College of Engineering" },
                  { label: "Short Code *", key: "code", placeholder: "GHRCE" },
                  { label: "City *", key: "city", placeholder: "Nagpur" },
                  { label: "State *", key: "state", placeholder: "Maharashtra" },
                  { label: "Country", key: "country", placeholder: "India" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">{field.label}</label>
                    <input type="text" placeholder={field.placeholder}
                      value={form[field.key as keyof CreateCollegePayload]}
                      onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="p-5 pt-0 flex gap-2.5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editCollege ? "Save Changes" : "Create College"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Roster Upload Modal */}
      <RosterUploadModal
        college={items.find((c) => c.id === rosterCollegeId) ?? null}
        isOpen={rosterCollegeId !== null}
        onClose={() => setRosterCollegeId(null)}
        onSuccess={() => { setRosterCollegeId(null); refetch(); }}
      />
    </div>
  );
}
