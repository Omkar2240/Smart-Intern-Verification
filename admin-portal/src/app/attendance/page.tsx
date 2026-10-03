"use client";

import React, { useState } from "react";
import {
  Clock,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Activity,
  Radio,
  Navigation,
  Crosshair,
  Cpu,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";

interface AttendanceRecord {
  id: string;
  studentName: string;
  regNumber: string;
  companyName: string;
  timestamp: string;
  distanceMeters: number;
  maxRadiusMeters: number;
  faceMatchScore: number;
  livenessPassed: boolean;
  status: "verified" | "geofence_breach" | "biometric_mismatch";
}

const SAMPLE_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att-001",
    studentName: "Aditya Sharma",
    regNumber: "GH2022CS042",
    companyName: "TCS Innovation Labs",
    timestamp: "10:14:22 AM",
    distanceMeters: 42,
    maxRadiusMeters: 200,
    faceMatchScore: 97.4,
    livenessPassed: true,
    status: "verified",
  },
  {
    id: "att-002",
    studentName: "Pooja Deshmukh",
    regNumber: "GH2022IT018",
    companyName: "Infosys STPI",
    timestamp: "10:12:05 AM",
    distanceMeters: 68,
    maxRadiusMeters: 250,
    faceMatchScore: 95.8,
    livenessPassed: true,
    status: "verified",
  },
  {
    id: "att-003",
    studentName: "Rahul Kulkarni",
    regNumber: "GH2022ME089",
    companyName: "Persistent Systems",
    timestamp: "10:05:40 AM",
    distanceMeters: 120,
    maxRadiusMeters: 150,
    faceMatchScore: 98.1,
    livenessPassed: true,
    status: "verified",
  },
  {
    id: "att-004",
    studentName: "Sneha Patil",
    regNumber: "GH2022CS110",
    companyName: "Cognizant Technology",
    timestamp: "09:58:19 AM",
    distanceMeters: 54,
    maxRadiusMeters: 200,
    faceMatchScore: 96.2,
    livenessPassed: true,
    status: "verified",
  },
  {
    id: "att-005",
    studentName: "Vikram Jadhav",
    regNumber: "GH2022EE031",
    companyName: "Wipro Digital Campus",
    timestamp: "09:45:02 AM",
    distanceMeters: 310,
    maxRadiusMeters: 200,
    faceMatchScore: 94.0,
    livenessPassed: true,
    status: "geofence_breach",
  },
];

export default function AttendanceAuditPage() {
  const [records] = useState<AttendanceRecord[]>(SAMPLE_ATTENDANCE);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Attendance & Geofencing Radar Telemetry"
          description="Live biometric mobile check-ins, haversine geofence perimeter validation, and FFT anti-spoofing audit stream."
        />

        <main className="flex-1 p-8 space-y-7 overflow-y-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-reveal-1">
            <StatCard
              title="Verified Check-ins"
              value="142 Today"
              subtitle="Mobile biometric scans"
              icon={UserCheck}
              color="emerald"
            />
            <StatCard
              title="Geofence Accuracy"
              value="99.3%"
              subtitle="Within allocated company perimeter"
              icon={Navigation}
              color="cyan"
            />
            <StatCard
              title="Biometric Match Avg"
              value="96.7%"
              subtitle="ArcFace cosine similarity"
              icon={Cpu}
              color="indigo"
            />
            <StatCard
              title="Spoofing Alerts"
              value="0 Flagged"
              subtitle="FFT frequency texture check"
              icon={AlertTriangle}
              color="amber"
            />
          </div>

          {/* Real-time Telemetry Banner */}
          <div className="animate-reveal-2 relative p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4 overflow-hidden">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <Radio className="w-5 h-5 animate-pulse text-sky-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>GPS Geofence & Mobile Biometric Daemon</span>
                  <span className="font-mono text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                    Listening
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mobile check-in requests are cross-verified with partner company latitude/longitude boundaries using the Haversine spherical model.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-sky-700 font-bold flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-sky-600" />
                <span>Radius Tolerance: ±250m</span>
              </div>
            </div>
          </div>

          {/* Audit Stream Table */}
          <div className="animate-reveal-3 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Live Attendance Audit Feed</h3>
                  <p className="text-xs text-slate-500">Real-time mobile punch logs with biometric confidence and GPS telemetry.</p>
                </div>
              </div>

              <span className="font-mono text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Showing 5 Recent Punches
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-mono text-[10px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-4 px-6">Student Intern</th>
                    <th className="py-4 px-6">Target Organization</th>
                    <th className="py-4 px-6">Time (UTC)</th>
                    <th className="py-4 px-6">Geofence Distance</th>
                    <th className="py-4 px-6">Face Match Score</th>
                    <th className="py-4 px-6">Liveness Check</th>
                    <th className="py-4 px-6 text-right">Audit Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-100 border border-sky-200 font-bold text-xs text-sky-700 flex items-center justify-center shrink-0 shadow-xs">
                            {item.studentName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.studentName}</p>
                            <p className="font-mono text-[11px] text-slate-500 mt-0.5">{item.regNumber}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-800 font-semibold">
                        {item.companyName}
                      </td>

                      <td className="py-4 px-6 font-mono text-sky-700 font-bold">
                        {item.timestamp}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <MapPin
                            className={`w-3.5 h-3.5 ${
                              item.distanceMeters <= item.maxRadiusMeters
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                          />
                          <span
                            className={
                              item.distanceMeters <= item.maxRadiusMeters
                                ? "text-emerald-700 font-bold"
                                : "text-rose-700 font-bold"
                            }
                          >
                            {item.distanceMeters}m
                          </span>
                          <span className="text-[10px] text-slate-400">/ {item.maxRadiusMeters}m</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold text-emerald-700">
                          {item.faceMatchScore}%
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {item.livenessPassed ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PASSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-rose-700">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> FAILED
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {item.status === "verified" ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            COMPLIANT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            RADIUS BREACH
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
