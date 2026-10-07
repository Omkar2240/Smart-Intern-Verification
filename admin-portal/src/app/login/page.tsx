"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Lock, Mail, Loader2, AlertCircle, Terminal, KeyRound, Crown, Award, BookOpen, ChevronRight } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { api } from "@/lib/api";
import { AdminUser } from "@/types/admin";
import { clsx } from "clsx";

// Demo credentials for frontend-only mode
const DEMO_ACCOUNTS = [
  {
    role: "super_admin" as const,
    email: "superadmin@trackintern.edu",
    password: "demo1234",
    name: "N. Super Administrator",
    label: "Super Admin",
    sublabel: "Top Level · System Wide",
    icon: Crown,
    gradient: "from-purple-500 to-indigo-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  {
    role: "college_admin" as const,
    email: "ghrce.admin@trackintern.edu",
    password: "demo1234",
    name: "GHRCE Admin",
    label: "College Admin",
    sublabel: "Middle Level · Institution",
    icon: Award,
    gradient: "from-sky-500 to-blue-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
  },
  {
    role: "department_admin" as const,
    email: "cse.admin@trackintern.edu",
    password: "demo1234",
    name: "CSE Dept Admin",
    label: "Department Admin",
    sublabel: "Lowest Level · Department",
    icon: BookOpen,
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
];

function LoginForm() {
  const { login } = useAdminAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"demo" | "credentials">("demo");

  useEffect(() => {
    const errParam = searchParams.get("error");
    const expParam = searchParams.get("expired");
    if (errParam === "unauthorized") setError("Access denied: Account lacks administrator privileges.");
    else if (expParam === "1") setError("Your session has timed out. Please authenticate again.");
  }, [searchParams]);

  // Demo login — no API needed
  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setDemoLoading(account.role);
    setError(null);
    await new Promise(r => setTimeout(r, 800)); // simulate auth
    const mockUser: AdminUser = {
      id: `demo-${account.role}`,
      name: account.name,
      email: account.email,
      role: account.role,
      college_id: account.role !== "super_admin" ? "college-001" : null,
      college_name: account.role !== "super_admin" ? "G. H. Raisoni College of Engineering" : null,
      department_id: account.role === "department_admin" ? "dept-001" : null,
      department_name: account.role === "department_admin" ? "Computer Science & Engineering" : null,
      is_active: true,
    };
    // Set a fake token so auth context doesn't redirect
    api.setToken("demo-token-" + account.role);
    login("demo-token-" + account.role, mockUser);
    setDemoLoading(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter both email and password."); return; }
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.login(email, password);
      login(res.access_token, res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed. Check credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] bg-circuit-grid relative overflow-hidden selection:bg-sky-500/20">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-sky-500/20 mb-4 ring-1 ring-black/5">
            <Terminal className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-[10px] text-sky-700 tracking-widest uppercase font-bold">Secure Oversight Gateway</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Track<span className="text-sky-600">Intern</span> Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Multi-role verification console for biometric ID, internship oversight & compliance.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => setMode("demo")}
            className={clsx("flex-1 py-2 rounded-lg text-xs font-bold transition-all", mode === "demo" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            Quick Demo Access
          </button>
          <button
            onClick={() => setMode("credentials")}
            className={clsx("flex-1 py-2 rounded-lg text-xs font-bold transition-all", mode === "credentials" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            Login with Credentials
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Mode */}
        {mode === "demo" && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xl shadow-slate-200/50 relative overflow-hidden space-y-3">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

            <div className="text-center mb-2">
              <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Select a role to preview the dashboard</p>
            </div>

            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              const isLoading = demoLoading === account.role;
              return (
                <button
                  key={account.role}
                  onClick={() => handleDemoLogin(account)}
                  disabled={demoLoading !== null}
                  className={clsx(
                    "w-full flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer group",
                    "hover:shadow-md disabled:opacity-60",
                    account.bg, account.border
                  )}
                >
                  <div className={clsx("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm", account.gradient)}>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <p className={clsx("font-bold text-[13px]", account.text)}>{account.label}</p>
                    <p className="font-mono text-[10px] text-slate-500">{account.sublabel}</p>
                  </div>
                  <ChevronRight className={clsx("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", account.text)} />
                </button>
              );
            })}

            <div className="pt-2 border-t border-slate-100">
              <p className="text-center font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                Demo mode — no backend required · All data is mock
              </p>
            </div>
          </div>
        )}

        {/* Credentials Mode */}
        {mode === "credentials" && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-xl shadow-slate-200/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-mono text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@institution.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50/60 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Security Passkey
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-50/60 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Authenticating...</span></>
                ) : (
                  <><KeyRound className="w-4 h-4" /><span>Sign In to Console</span></>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <span className="font-mono text-[10px] text-slate-500">
                CLEARANCE: <span className="text-purple-700 font-bold">SUPER_ADMIN</span> ·{" "}
                <span className="text-sky-700 font-bold">COLLEGE_ADMIN</span> ·{" "}
                <span className="text-emerald-700 font-bold">DEPT_ADMIN</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
