"use client";

import React from "react";
import { Clock, ShieldCheck, MapPin, AlertTriangle, CheckCircle2, UserCheck } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";

export default function AttendanceAuditPage() {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Attendance & Geofencing Anti-Spoofing Audits"
          description="Live monitor of intern check-ins, geofence radius violations, and biometric matching scores."
        />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Today's Check-ins"
              value="Live Sync"
              subtitle="All verified partner companies"
              icon={UserCheck}
              color="indigo"
            />
            <StatCard
              title="Geofence Accuracy"
              value="100%"
              subtitle="Inside allocated radius"
              icon={MapPin}
              color="emerald"
            />
            <StatCard
              title="Spoofing Attempts"
              value="0 Flagged"
              subtitle="Anti-spoofing FFT analysis"
              icon={AlertTriangle}
              color="amber"
            />
          </div>

          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Live Attendance Stream Ready</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Attendance check-ins submitted from the mobile app are verified against ArcFace embeddings and company geofencing coordinates.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
