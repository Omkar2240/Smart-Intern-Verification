"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { VerificationItem } from "@/types/admin";

interface SmartIdCardProps {
  item: VerificationItem;
  className?: string;
  imageUrl?: string | null;
}

export function SmartIdCard({ item, className = "", imageUrl = null }: SmartIdCardProps) {
  const [copied, setCopied] = useState(false);

  const metadata = item.extracted_metadata || {};
  const fields = metadata.fields || {};
  const department = fields.department || "Computer Engineering / Technology";
  const validUntil = fields.valid_until || "Academic Session 2023 - 2027";
  const collegeName = item.college_name || fields.college_name || "G. H. Raisoni College of Engineering, Nagpur";
  const studentName = item.user_name || fields.student_name || "Enrolled Student";
  const regNumber = item.registration_number || fields.registration_number || "REG-NOT-ASSIGNED";

  const initials = studentName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const copyRegNo = () => {
    navigator.clipboard.writeText(regNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadSvg = () => {
    const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" width="680" height="420" viewBox="0 0 680 420">
  <defs>
    <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
  </defs>

  <!-- Outer Card Frame -->
  <rect width="680" height="420" rx="20" fill="url(#bgGrad)" stroke="#cbd5e1" stroke-width="2" />

  <!-- Header Banner -->
  <path d="M 0 20 Q 0 0 20 0 L 660 0 Q 680 0 680 20 L 680 90 L 0 90 Z" fill="url(#headerGrad)" />
  <rect y="86" width="680" height="4" fill="#0284c7" />

  <!-- College Crest Icon -->
  <circle cx="52" cy="45" r="24" fill="#0284c7" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.5" />
  <path d="M 52 32 L 64 40 L 52 48 L 40 40 Z" fill="#38bdf8" />
  <path d="M 44 45 L 44 54 Q 52 58 60 54 L 60 45" stroke="#38bdf8" stroke-width="2" fill="none" />

  <!-- Header Text -->
  <text x="88" y="38" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" letter-spacing="0.5">${collegeName.slice(0, 48)}</text>
  <text x="88" y="58" fill="#93c5fd" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1.2">OFFICIAL STUDENT IDENTITY CARD • ACCREDITED</text>

  <!-- Photo Box -->
  <rect x="40" y="115" width="135" height="170" rx="14" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2" />
  <circle cx="107" cy="180" r="38" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" />
  <text x="107" y="192" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" text-anchor="middle">${initials}</text>
  <rect x="55" y="255" width="105" height="20" rx="5" fill="#0f172a" />
  <text x="107" y="269" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" text-anchor="middle" letter-spacing="1">STUDENT ID</text>

  <!-- RFID Chip Graphic -->
  <rect x="77" y="298" width="60" height="20" rx="4" fill="#fbbf24" fill-opacity="0.25" stroke="#d97706" stroke-width="1" />
  <text x="107" y="312" fill="#b45309" font-family="monospace" font-size="8" font-weight="700" text-anchor="middle">RFID ENCRYPT</text>

  <!-- Student Info -->
  <text x="200" y="132" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="1">STUDENT FULL NAME</text>
  <text x="200" y="156" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800">${studentName.slice(0, 36)}</text>

  <text x="200" y="188" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="1">ENROLLMENT / REGISTRATION NO.</text>
  <text x="200" y="210" fill="#0284c7" font-family="monospace" font-size="16" font-weight="800">${regNumber}</text>

  <text x="200" y="240" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="1">DEPARTMENT / PROGRAM</text>
  <text x="200" y="258" fill="#334155" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">${department.slice(0, 38)}</text>

  <text x="200" y="286" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="1">SESSION VALIDITY</text>
  <text x="200" y="304" fill="#334155" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">${validUntil}</text>

  <!-- Footer Banner -->
  <rect y="340" width="680" height="80" rx="0" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
  
  <!-- Barcode Visual -->
  <g transform="translate(40, 355)">
    <rect x="0" y="0" width="3" height="32" fill="#0f172a" />
    <rect x="6" y="0" width="5" height="32" fill="#0f172a" />
    <rect x="15" y="0" width="2" height="32" fill="#0f172a" />
    <rect x="20" y="0" width="4" height="32" fill="#0f172a" />
    <rect x="28" y="0" width="2" height="32" fill="#0f172a" />
    <rect x="34" y="0" width="6" height="32" fill="#0f172a" />
    <rect x="44" y="0" width="2" height="32" fill="#0f172a" />
    <rect x="50" y="0" width="4" height="32" fill="#0f172a" />
    <rect x="58" y="0" width="3" height="32" fill="#0f172a" />
    <rect x="65" y="0" width="5" height="32" fill="#0f172a" />
    <rect x="74" y="0" width="2" height="32" fill="#0f172a" />
    <rect x="80" y="0" width="4" height="32" fill="#0f172a" />
    <rect x="88" y="0" width="2" height="32" fill="#0f172a" />
    <rect x="94" y="0" width="6" height="32" fill="#0f172a" />
    <rect x="104" y="0" width="3" height="32" fill="#0f172a" />
    <rect x="110" y="0" width="5" height="32" fill="#0f172a" />
    <rect x="120" y="0" width="2" height="32" fill="#0f172a" />
    <rect x="126" y="0" width="4" height="32" fill="#0f172a" />
    <text x="65" y="44" fill="#64748b" font-family="monospace" font-size="8" text-anchor="middle">* ${regNumber} *</text>
  </g>

  <!-- Authorized Stamp -->
  <g transform="translate(480, 348)">
    <text x="80" y="16" fill="#0f172a" font-family="'Brush Script MT', cursive, sans-serif" font-size="20">Dean Academics</text>
    <line x1="20" y1="22" x2="160" y2="22" stroke="#94a3b8" stroke-dasharray="2,2" stroke-width="1" />
    <text x="90" y="34" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" text-anchor="middle" letter-spacing="1">AUTHORIZED REGISTRAR</text>
  </g>

  <!-- Security Hologram Tag -->
  <rect x="250" y="356" width="160" height="28" rx="6" fill="#ecfdf5" stroke="#10b981" stroke-width="1" />
  <circle cx="265" cy="370" r="5" fill="#10b981" />
  <text x="335" y="374" fill="#047857" font-family="monospace" font-size="9" font-weight="800" text-anchor="middle">DIGITIZED &amp; VERIFIED</text>
</svg>
    `.trim();

    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `college-id-${regNumber || "student"}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Smart Card Container */}
      <div className="relative w-full max-w-[520px] mx-auto rounded-2xl border-2 border-slate-300/80 bg-white shadow-xl shadow-slate-200/60 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-slate-400/80">
        {/* Top Metallic Border */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500" />

        {/* Card Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-3.5 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <GraduationCap className="w-6 h-6 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight leading-snug line-clamp-1 text-slate-100">
                {collegeName}
              </span>
              <span className="font-mono text-[9px] font-bold text-sky-300 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                Institutional Student Identity Card
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[9px] font-bold tracking-wider shrink-0 uppercase">
            Active
          </span>
        </div>

        {/* Card Body */}
        <div className="p-5 grid grid-cols-12 gap-5 items-center bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60">
          {/* Left Column: Photo & RFID */}
          <div className="col-span-4 flex flex-col items-center gap-2.5">
            <div className="relative w-28 h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300 flex flex-col items-center justify-center shadow-md overflow-hidden group">
              {imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl}
                  alt={studentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Silhouette / Initials */
                <div className="w-16 h-16 rounded-full bg-slate-900 text-sky-400 flex items-center justify-center font-extrabold text-xl shadow-inner border-2 border-white/50">
                  {initials || "ST"}
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 py-1 text-center">
                <span className="font-mono text-[9px] font-extrabold tracking-widest text-sky-300 uppercase">
                  Student ID
                </span>
              </div>
            </div>

            {/* RFID Chip Graphic */}
            <div className="w-28 py-1 px-2 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-between shadow-xs">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-3 bg-amber-500/40 rounded-xs" />
                <span className="w-2.5 h-3 bg-amber-500/70 rounded-xs" />
                <span className="w-1.5 h-3 bg-amber-500/40 rounded-xs" />
              </div>
              <span className="font-mono text-[8px] font-bold text-amber-800 uppercase tracking-wider">
                RFID Chip
              </span>
            </div>
          </div>

          {/* Right Column: Identity Records */}
          <div className="col-span-8 flex flex-col gap-2.5">
            <div>
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-600 block">
                Student Full Name
              </span>
              <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                {studentName}
              </h4>
            </div>

            <div>
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-600 block">
                Enrollment / PRN Number
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-xs font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 tracking-wide">
                  {regNumber}
                </span>
                <button
                  type="button"
                  onClick={copyRegNo}
                  title="Copy Registration Number"
                  className="p-1 rounded text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-600 block">
                  Department
                </span>
                <span className="font-semibold text-slate-800 line-clamp-1 text-[11px]">
                  {department}
                </span>
              </div>
              <div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-600 block">
                  Academic Validity
                </span>
                <span className="font-semibold text-slate-800 text-[11px]">
                  {validUntil}
                </span>
              </div>
            </div>

            <div>
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-600 block">
                Official Contact
              </span>
              <span className="font-mono text-[11px] text-slate-700">
                {item.mobile_number} • {item.user_email}
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {/* Simulated Barcode */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-0.5 h-6">
              <span className="w-0.5 h-full bg-slate-900" />
              <span className="w-1.5 h-full bg-slate-900" />
              <span className="w-0.5 h-full bg-slate-900" />
              <span className="w-1 h-full bg-slate-900" />
              <span className="w-0.5 h-full bg-slate-900" />
              <span className="w-2 h-full bg-slate-900" />
              <span className="w-0.5 h-full bg-slate-900" />
              <span className="w-1.5 h-full bg-slate-900" />
              <span className="w-1 h-full bg-slate-900" />
              <span className="w-0.5 h-full bg-slate-900" />
              <span className="w-2 h-full bg-slate-900" />
              <span className="w-0.5 h-full bg-slate-900" />
              <span className="w-1 h-full bg-slate-900" />
              <span className="w-1.5 h-full bg-slate-900" />
              <span className="w-0.5 h-full bg-slate-900" />
              <span className="w-2 h-full bg-slate-900" />
              <span className="w-0.5 h-full bg-slate-900" />
            </div>
            <span className="font-mono text-[8px] text-slate-600 tracking-wider">
              {regNumber}
            </span>
          </div>

          {/* Accreditation Seal */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-mono text-[9px] font-bold text-emerald-800 uppercase tracking-wide">
                Verified Record
              </span>
            </div>

            <div className="text-right">
              <span className="font-serif italic text-xs text-slate-800 block leading-none">
                Dean Academics
              </span>
              <span className="font-mono text-[8px] font-bold text-slate-600 uppercase tracking-widest block mt-0.5">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          <span className="font-medium text-[11px]">
            Digitized Institutional Identity Record
          </span>
        </div>

        <button
          type="button"
          onClick={downloadSvg}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          Export Vector ID
        </button>
      </div>
    </div>
  );
}
