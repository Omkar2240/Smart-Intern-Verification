"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Radio } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

export function Header({ title, description }: { title: string; description?: string }) {
  const { user } = useAdminAuth();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-20 transition-all shadow-xs">
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {title}
          </h2>
        </div>
        {description && (
          <p className="text-xs text-slate-500 font-normal mt-0.5 tracking-tight">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3.5">
        {/* System Clock & Telemetry */}
        {time && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
            <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span className="font-mono text-xs font-semibold text-slate-800 tracking-wider">
              {time} <span className="text-[10px] text-slate-500 font-normal">UTC</span>
            </span>
          </div>
        )}

        {/* Verification Status Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span className="font-mono text-[11px] font-bold text-emerald-800 tracking-wide uppercase">
            Biometric Node Live
          </span>
        </div>

        {/* Operator Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block text-left">
            <span className="font-mono text-xs text-slate-800 font-bold block leading-tight truncate max-w-[160px]">
              {user?.email || "admin@trackintern.org"}
            </span>
            <span className="font-mono text-[10px] text-sky-600 uppercase tracking-wider block font-semibold">
              Authorized Console
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
