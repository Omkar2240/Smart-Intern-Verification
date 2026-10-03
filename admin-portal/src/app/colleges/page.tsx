"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Plus,
  UploadCloud,
  Search,
  RefreshCw,
  MapPin,
  GraduationCap,
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
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Colleges & Whitelist Registries"
          description="Manage accredited academic institutions, automated OCR verification keywords, and student enrolment whitelists."
        />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by college name, city, code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 w-72 transition-all shadow-xs"
                />
              </div>

              <button
                onClick={fetchColleges}
                disabled={isLoading}
                title="Refresh Registry"
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
              </button>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Accredited College</span>
            </button>
          </div>

          {/* Colleges Grid */}
          {isLoading ? (
            <div className="text-center py-28 text-slate-500">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto mb-3">
                <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
              </div>
              <p className="font-mono text-xs text-slate-700">Loading institutional registries...</p>
            </div>
          ) : colleges.length === 0 ? (
            <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 max-w-lg mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Institutions Registered</h4>
              <p className="text-xs text-slate-500 mt-1">Get started by onboarding your first partner institution.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {colleges.map((college) => (
                <div
                  key={college.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 transition-all duration-200 flex flex-col justify-between group shadow-xs hover:shadow-md hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-100 text-sky-600 border border-sky-200 group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                        {college.code || "NO CODE"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">
                      {college.name}
                    </h4>

                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>
                        {college.city}, {college.state}
                        {college.country ? `, ${college.country}` : ""}
                      </span>
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Whitelisted
                    </span>

                    <button
                      onClick={() => setSelectedCollegeForRoster(college)}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Import Roster
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
