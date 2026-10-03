"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Lock, Mail, Loader2, AlertCircle, Terminal, KeyRound } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { api } from "@/lib/api";

function LoginForm() {
  const { login } = useAdminAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errParam = searchParams.get("error");
    const expParam = searchParams.get("expired");
    if (errParam === "unauthorized") {
      setError("Access denied: Your account does not have administrator privileges (college_admin or super_admin).");
    } else if (expParam === "1") {
      setError("Your operational session has timed out. Please authenticate again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both administrator email and password.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.login(email, password);

      // Verify that this account actually has administrative permissions
      try {
        await api.getAnalyticsSummary();
      } catch {
        api.setToken(null);
        setError("Access denied: Account authenticated but lacks administrative clearance.");
        return;
      }

      login(res.access_token, res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed. Check credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] bg-circuit-grid relative overflow-hidden selection:bg-sky-500/20 selection:text-sky-900">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-reveal-1">
        {/* Terminal Header Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-sky-500/20 mb-4 ring-1 ring-black/5">
            <Terminal className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-[10px] text-sky-700 tracking-widest uppercase font-bold">
              Secure Oversight Gateway
            </span>
          </div>
          
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Track<span className="text-sky-600">Intern</span> Admin
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            Institutional verification console for biometrics, student rosters, and multi-stage compliance.
          </p>
        </div>

        {/* Cyber Console Card in Light Theme */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl shadow-slate-200/60 relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

          {/* Telemetry crosshair marks */}
          <div className="absolute top-3 left-3 font-mono text-[9px] text-slate-400 select-none">+</div>
          <div className="absolute top-3 right-3 font-mono text-[9px] text-slate-400 select-none">+</div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            <div>
              <label className="font-mono text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Administrator Identifier
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all font-medium"
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Initialize Terminal Session</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Clearance Indicator */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <span className="font-mono text-[10px] text-slate-500 tracking-wider">
              AUTHORIZED CLEARANCE: <span className="text-sky-700 font-bold">COLLEGE_ADMIN</span> •{" "}
              <span className="text-sky-700 font-bold">SUPER_ADMIN</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-900">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
