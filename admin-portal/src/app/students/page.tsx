"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Users, Search, RefreshCw, Eye, Briefcase } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ReviewDrawer } from "@/components/ReviewDrawer";
import { VerificationItem } from "@/types/admin";
import { api } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function StudentsPage() {
  const { isLoading: authLoading } = useAdminAuth();
  const [students, setStudents] = useState<VerificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getVerifications({
        search,
        page: 1,
        page_size: 50,
      });
      setStudents(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!authLoading) {
      fetchStudents();
    }
  }, [authLoading, fetchStudents]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Student Biometric Directory"
          description="Comprehensive registry of all enrolled intern accounts, ArcFace embeddings, and verification statuses."
        />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students by name, email, roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 w-80 transition-all font-medium shadow-xs"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-500 font-semibold">
                {total} Total Profiles
              </span>
              <button
                onClick={fetchStudents}
                disabled={isLoading}
                title="Refresh Directory"
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-6">Student Intern</th>
                  <th className="py-4 px-6">Institution</th>
                  <th className="py-4 px-6">Registered Placement</th>
                  <th className="py-4 px-6">College ID</th>
                  <th className="py-4 px-6">Biometric Enrollment</th>
                  <th className="py-4 px-6">Access Clearance</th>
                  <th className="py-4 px-6 text-right">Oversight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-slate-500">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto mb-3">
                        <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
                      </div>
                      <p className="font-mono text-xs text-slate-700">Synchronizing student records...</p>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-slate-500">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-slate-800 font-bold">No students found</p>
                      <p className="text-[11px] text-slate-500 mt-1">Try modifying your search query.</p>
                    </td>
                  </tr>
                ) : (
                  students.map((item) => (
                    <tr
                      key={item.user_id}
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDrawerOpen(true);
                      }}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-100 border border-sky-200 font-bold text-xs text-sky-700 flex items-center justify-center shrink-0 shadow-xs">
                            {item.user_name[0]?.toUpperCase() || "S"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                              {item.user_name}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                              {item.registration_number || "NO-ROLL"} • {item.user_email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {item.college_name || <span className="font-mono text-slate-400 italic">Unassigned</span>}
                      </td>

                      <td className="py-4 px-6">
                        {item.internships && item.internships.length > 0 ? (
                          <div>
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                              {item.internships.find((i) => i.is_active)?.company_name || item.internships[0].company_name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                              {item.internships.length} {item.internships.length === 1 ? "posting" : "postings"}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-400 text-[11px] italic">No active role</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {item.college_id_status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {item.has_face_embedding ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ArcFace 512-D
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            Not Enrolled
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                            item.overall_status === "verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {item.overall_status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setIsDrawerOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <ReviewDrawer
        item={selectedItem}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onActionComplete={fetchStudents}
      />
    </div>
  );
}
