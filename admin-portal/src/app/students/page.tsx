"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Users, Search, RefreshCw, Eye, CheckCircle2, XCircle, Clock } from "lucide-react";
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
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Enrolled Student Directory"
          description="Comprehensive roster of all registered intern accounts, biometric profiles, and verification stages."
        />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students by name, email, roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-80"
              />
            </div>

            <button
              onClick={fetchStudents}
              disabled={isLoading}
              title="Refresh"
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-5">Student</th>
                  <th className="py-3.5 px-5">College Institution</th>
                  <th className="py-3.5 px-5">College ID Document</th>
                  <th className="py-3.5 px-5">Biometrics (ArcFace)</th>
                  <th className="py-3.5 px-5">Overall Access</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                      Loading student directory...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      No students found matching your search.
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
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 font-bold text-xs text-indigo-400 flex items-center justify-center shrink-0">
                            {item.user_name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{item.user_name}</p>
                            <p className="text-[11px] text-slate-400">
                              {item.registration_number} • {item.user_email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-slate-300">
                        {item.college_name || <span className="text-slate-400">—</span>}
                      </td>

                      <td className="py-3.5 px-5 capitalize text-slate-300">
                        {item.college_id_status.replace("_", " ")}
                      </td>

                      <td className="py-3.5 px-5">
                        {item.has_face_embedding ? (
                          <span className="text-emerald-400 font-medium">Enrolled</span>
                        ) : (
                          <span className="text-slate-400">Not Enrolled</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                            item.overall_status === "verified"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                          }`}
                        >
                          {item.overall_status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setIsDrawerOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs inline-flex items-center gap-1 transition-all"
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
