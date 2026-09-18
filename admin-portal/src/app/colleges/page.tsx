"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Plus,
  UploadCloud,
  Search,
  CheckCircle2,
  RefreshCw,
  MapPin,
  FileSpreadsheet,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { CreateCollegeModal } from "@/components/CreateCollegeModal";
import { RosterUploadModal } from "@/components/RosterUploadModal";
import { College } from "@/types/admin";
import { api } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function CollegesPage() {
  const { isLoading: authLoading } = useAdminAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCollegeForRoster, setSelectedCollegeForRoster] = useState<College | null>(null);

  const fetchColleges = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getColleges(search);
      setColleges(data);
    } catch (err) {
      console.error("Failed to load colleges:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!authLoading) {
      fetchColleges();
    }
  }, [authLoading, fetchColleges]);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Colleges & Institution Whitelist Rosters"
          description="Manage accredited academic institutions, automated OCR keywords, and student enrolment whitelists."
        />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by college name, city, code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-72"
                />
              </div>

              <button
                onClick={fetchColleges}
                disabled={isLoading}
                title="Refresh"
                className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Institution
            </button>
          </div>

          {/* Colleges Grid */}
          {isLoading ? (
            <div className="text-center py-24 text-slate-400">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto text-indigo-400 mb-2" />
              Loading institutions...
            </div>
          ) : colleges.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
              <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-white">No Colleges Found</h4>
              <p className="text-xs mt-1">Get started by creating your first partner institution.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {colleges.map((college) => (
                <div
                  key={college.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {college.code || "NO CODE"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {college.name}
                    </h4>

                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {college.city}, {college.state}, {college.country}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Institution
                    </span>

                    <button
                      onClick={() => setSelectedCollegeForRoster(college)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs inline-flex items-center gap-1.5 transition-all"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Import Roster (CSV)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <CreateCollegeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchColleges}
      />

      <RosterUploadModal
        college={selectedCollegeForRoster}
        isOpen={Boolean(selectedCollegeForRoster)}
        onClose={() => setSelectedCollegeForRoster(null)}
        onSuccess={() => {
          fetchColleges();
        }}
      />
    </div>
  );
}
