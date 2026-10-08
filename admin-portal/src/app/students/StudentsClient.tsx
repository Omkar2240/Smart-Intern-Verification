"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Search, CheckCircle2, AlertTriangle, Briefcase, Plus, Pencil, X,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { PaginationBar } from "@/components/PaginationBar";
import { TableSkeleton, ErrorBanner, EmptyState } from "@/components/UiStates";
import { VerificationStatusBadge } from "@/components/StatusBadges";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { Student, StudentListResponse, College, Department, CreateStudentPayload } from "@/types/admin";
import { ROLE } from "@/constants/roles.constants";
import { INTERNSHIP_STATUS, VERIFICATION_STATUS } from "@/constants/status.constants";
import { clsx } from "clsx";

interface Props {
  initialData: StudentListResponse | null;
  colleges: College[];
  departments?: Department[];
}

const INTERNSHIP_STATUS_COLORS: Record<string, string> = {
  [INTERNSHIP_STATUS.ACTIVE]: "bg-emerald-50 text-emerald-700 border-emerald-200",
  [INTERNSHIP_STATUS.COMPLETED]: "bg-blue-50 text-blue-700 border-blue-200",
  [INTERNSHIP_STATUS.NOT_STARTED]: "bg-slate-50 text-slate-500 border-slate-200",
};

export function StudentsClient({
  initialData,
  colleges,
  departments: initialDepartments = [],
}: Props) {
  const { user } = useAdminAuth();
  const role = user?.role ?? ROLE.DEPARTMENT_ADMIN;
  const isPlatformAdmin = role === ROLE.SUPER_ADMIN || role === ROLE.ADMIN;

  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [internshipFilter, setInternshipFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [studentModal, setStudentModal] = useState<Student | null | "create">(null);
  const [departments] = useState<Department[]>(() => initialDepartments ?? []);
  const [form, setForm] = useState<CreateStudentPayload>({
    name: "", registration_number: "", email: "", mobile_number: "",
    password: "", department_id: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const { data, loading, error, refetch } = useApi(
    () => api.getStudents({
      search: debouncedSearch || undefined,
      verification_status: verificationFilter === "all" ? undefined : (verificationFilter as never),
      internship_status: internshipFilter === "all" ? undefined : internshipFilter,
      college_id: collegeFilter || undefined,
      page, page_size: 20,
    }),
    [debouncedSearch, verificationFilter, internshipFilter, collegeFilter, page],
  );

  const items = data?.items ?? initialData?.items ?? [];
  const total = data?.total ?? initialData?.total ?? 0;

  const verified = items.filter((s) => s.verification_status === VERIFICATION_STATUS.VERIFIED).length;
  const pending = items.filter((s) => s.verification_status === VERIFICATION_STATUS.PENDING || s.verification_status === VERIFICATION_STATUS.MANUAL_REVIEW).length;
  const activeInterns = items.filter((s) => s.internship_status === INTERNSHIP_STATUS.ACTIVE).length;
  const formDepartments = form.college_id
    ? departments.filter((department) => department.college_id === form.college_id)
    : departments;

  const resetFilters = () => {
    setSearch(""); setVerificationFilter("all");
    setInternshipFilter("all"); setCollegeFilter(""); setPage(1);
  };

  const openCreate = () => {
    setForm({
      name: "", registration_number: "", email: "", mobile_number: "",
      password: "", department_id: "", college_id: isPlatformAdmin ? "" : (user?.college_id ?? undefined),
    });
    setFormError("");
    setStudentModal("create");
  };

  const openEdit = (student: Student) => {
    setForm({
      name: student.name,
      email: student.email,
      registration_number: student.registration_number,
      mobile_number: student.mobile_number ?? "",
      department_id: student.department_id ?? "",
      college_id: student.college_id ?? undefined,
    });
    setFormError("");
    setStudentModal(student);
  };

  const updateForm = (key: keyof CreateStudentPayload, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "college_id") {
      setForm((current) => ({ ...current, department_id: "" }));
    }
  };

  const saveStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.department_id) {
      setFormError("Student name and department are required.");
      return;
    }
    if (studentModal === "create" && !form.registration_number?.trim()) {
      setFormError("Registration number is required when creating a student.");
      return;
    }
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, value]) => value !== undefined && value !== "")
      ) as CreateStudentPayload;
      if (studentModal === "create") {
        await api.createStudent(payload);
      } else if (studentModal) {
        await api.updateStudent(studentModal.id, payload);
      }
      setStudentModal(null);
      refetch();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Student Directory"
          description={
            isPlatformAdmin ? "All registered students platform-wide"
              : role === ROLE.COLLEGE_ADMIN ? "Students in your college"
              : "Students in your department"
          }
        />

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Total Students", value: total, icon: Users, color: "cyan" as const },
              { title: "Verified", value: verified, icon: CheckCircle2, color: "emerald" as const },
              { title: "Pending / Review", value: pending, icon: AlertTriangle, color: "amber" as const },
              { title: "Active Interns", value: activeInterns, icon: Briefcase, color: "indigo" as const },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StatCard {...stat} animate={false} />
              </motion.div>
            ))}
          </div>

          {/* Table Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
          >
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-1.5 rounded-lg bg-cyan-50 border border-cyan-200"><Users className="w-4 h-4 text-cyan-600" /></div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Student Records</h3>
                  <p className="font-mono text-[10px] text-slate-500">{total.toLocaleString()} students</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              {(isPlatformAdmin || role === ROLE.COLLEGE_ADMIN) && (
                <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Student
                </button>
              )}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" placeholder="Name, email, reg. no..." value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-sky-500 w-48 transition-all"
                  />
                </div>
                <select value={verificationFilter} onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Verifications</option>
                  <option value={VERIFICATION_STATUS.VERIFIED}>Verified</option>
                  <option value={VERIFICATION_STATUS.PENDING}>Pending</option>
                  <option value={VERIFICATION_STATUS.MANUAL_REVIEW}>Needs Review</option>
                  <option value={VERIFICATION_STATUS.REJECTED}>Rejected</option>
                  <option value={VERIFICATION_STATUS.NOT_STARTED}>Not Started</option>
                </select>
                <select value={internshipFilter} onChange={(e) => { setInternshipFilter(e.target.value); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">All Internships</option>
                  <option value={INTERNSHIP_STATUS.ACTIVE}>Active</option>
                  <option value={INTERNSHIP_STATUS.COMPLETED}>Completed</option>
                  <option value={INTERNSHIP_STATUS.NOT_STARTED}>Not Started</option>
                </select>
                {isPlatformAdmin && colleges.length > 0 && (
                  <select value={collegeFilter} onChange={(e) => { setCollegeFilter(e.target.value); setPage(1); }}
                    className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="">All Colleges</option>
                    {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            {error && <ErrorBanner message={error} onRetry={refetch} />}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    {["Student", "Reg. No.", "College", "Department", "Verification", "Internship", "Attendance", ...(isPlatformAdmin || role === ROLE.COLLEGE_ADMIN ? ["Actions"] : [])].map((col) => (
                      <th key={col} className="py-3 px-4 text-left font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={7}><TableSkeleton rows={8} cols={7} /></td></tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState icon={Users} title="No students found"
                          description={
                            <button onClick={resetFilters} className="text-sky-600 underline">Clear filters</button> as never
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    items.map((student, idx) => (
                      <motion.tr key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-100 border border-sky-200 font-bold text-[11px] text-sky-700 flex items-center justify-center shrink-0">
                              {student.name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{student.name}</p>
                              <p className="font-mono text-[10px] text-slate-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600">{student.registration_number}</td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-700">{student.college_name ?? "—"}</td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-700">{student.department_name ?? "—"}</td>
                        <td className="py-3.5 px-4"><VerificationStatusBadge status={student.verification_status} /></td>
                        <td className="py-3.5 px-4">
                          <span className={clsx("inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border",
                            INTERNSHIP_STATUS_COLORS[student.internship_status] ?? "bg-slate-50 text-slate-500 border-slate-200"
                          )}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {student.internship_status === INTERNSHIP_STATUS.NOT_STARTED ? "Not Started"
                              : student.internship_status === INTERNSHIP_STATUS.ACTIVE ? "Active" : "Completed"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {student.attendance_rate != null ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-16">
                                <div
                                  className={clsx("h-full rounded-full", student.attendance_rate >= 75 ? "bg-emerald-500" : "bg-amber-500")}
                                  style={{ width: `${Math.min(100, student.attendance_rate)}%` }}
                                />
                              </div>
                              <span className="font-mono text-[10px] text-slate-600">{student.attendance_rate}%</span>
                            </div>
                          ) : <span className="text-slate-400 text-[10px]">—</span>}
                        </td>
                        {(isPlatformAdmin || role === ROLE.COLLEGE_ADMIN) && (
                          <td className="py-3.5 px-4">
                            <button onClick={() => openEdit(student)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-sky-50 hover:text-sky-700">
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                          </td>
                        )}
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
      {studentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && setStudentModal(null)}>
          <form onSubmit={saveStudent} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">{studentModal === "create" ? "Add Student" : "Edit Student"}</h2>
                <p className="mt-1 text-xs text-slate-500">Required fields are marked with an asterisk.</p>
              </div>
              <button type="button" onClick={() => setStudentModal(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2 text-xs font-semibold text-slate-600">Student name *
                <input required value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-sky-500" />
              </label>
              {isPlatformAdmin && (
                <label className="text-xs font-semibold text-slate-600">College *
                  <select required value={form.college_id ?? ""} onChange={(e) => updateForm("college_id", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-sky-500">
                    <option value="">Select college</option>
                    {colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
                  </select>
                </label>
              )}
              <label className="text-xs font-semibold text-slate-600">Department *
                <select required value={form.department_id} onChange={(e) => updateForm("department_id", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-sky-500">
                  <option value="">Select department</option>
                  {formDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">Registration number *
                <input required={studentModal === "create"} value={form.registration_number ?? ""} onChange={(e) => updateForm("registration_number", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-sky-500" />
              </label>
              <label className="text-xs font-semibold text-slate-600">Email
                <input type="email" value={form.email ?? ""} onChange={(e) => updateForm("email", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-sky-500" />
              </label>
              <label className="text-xs font-semibold text-slate-600">Mobile number
                <input value={form.mobile_number ?? ""} onChange={(e) => updateForm("mobile_number", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-sky-500" />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Password
                <input type="password" placeholder={studentModal === "create" ? "Optional; can be added later" : "Leave blank to keep current"} value={form.password ?? ""} onChange={(e) => updateForm("password", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-sky-500" />
              </label>
            </div>
            {formError && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setStudentModal(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
              <button disabled={saving} className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50">{saving ? "Saving..." : "Save student"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
