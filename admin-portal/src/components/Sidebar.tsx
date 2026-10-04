"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Users,
  Clock,
  LogOut,
  Briefcase,
  Terminal,
  Activity,
  GraduationCap,
  Shield,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ROLE_NAVIGATION } from "@/constants/roles.constants";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  tag?: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Review Queue",
    href: "/verifications",
    icon: ShieldCheck,
  },
  {
    label: "Internships",
    href: "/internships",
    icon: Briefcase,
  },
  {
    label: "Colleges & Rosters",
    href: "/colleges",
    icon: Building2,
  },
  {
    label: "Departments",
    href: "/departments",
    icon: GraduationCap,
  },
  {
    label: "Admin Users",
    href: "/admin-users",
    icon: Shield,
  },
  {
    label: "Student Directory",
    href: "/students",
    icon: Users,
  },
  {
    label: "Attendance Audits",
    href: "/attendance",
    icon: Clock,
    tag: "Live",
  },
];

export function Sidebar({ pendingReviewCount }: { pendingReviewCount?: number }) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

  const role = user?.role || "";
  const allowedHrefs = ROLE_NAVIGATION[role] || ROLE_NAVIGATION.department_admin;

  // Filter nav items by role, inject live badges
  const navItems = ALL_NAV_ITEMS
    .filter((item) => allowedHrefs.includes(item.href))
    .map((item) =>
      item.href === "/verifications"
        ? { ...item, badge: pendingReviewCount && pendingReviewCount > 0 ? pendingReviewCount : undefined }
        : item
    );

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-2xl border-r border-slate-200 flex flex-col h-screen sticky top-0 text-slate-700 z-30 select-none shadow-sm">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-200 gap-3.5 relative overflow-hidden bg-white">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 ring-1 ring-black/5">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-slate-900">
              Track<span className="text-sky-600">Intern</span>
            </span>
            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200">
              v2.4
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <p className="font-mono text-[10px] text-slate-500 tracking-wide uppercase font-semibold">
              Ops Command
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
          <span>Oversight Modules</span>
          <Activity className="w-3 h-3 text-slate-400" />
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? "bg-sky-50 text-sky-700 border border-sky-200/80 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-sky-500 to-blue-600 rounded-r-full" />
              )}

              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-sky-600" : "text-slate-400 group-hover:text-slate-700"
                  }`}
                />
                <span className="tracking-tight">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.tag && (
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {item.tag}
                  </span>
                )}
                {item.badge !== undefined && (
                  <span className="font-mono text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </div>

      {/* Admin User Telemetry Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {user?.name || "Console Operator"}
              </p>
              <p className="font-mono text-[10px] text-sky-600 truncate uppercase tracking-wider font-semibold">
                {user?.role?.replace(/_/g, " ") || "Super Admin"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Terminate Session"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

