"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  BarChart3,
  FileText,
  Settings,
  BookOpen,
  Crown,
  Award,
  UserCog,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ROLE_LABELS, ROLE_COLORS } from "@/constants/roles.constants";
import { clsx } from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  tag?: string;
  section?: string;
}

const SUPER_ADMIN_NAV: NavItem[] = [
  { section: "OVERSIGHT", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Colleges", href: "/colleges", icon: Building2 },
  { label: "College Admins", href: "/college-admins", icon: Crown },
  { label: "Departments", href: "/departments", icon: GraduationCap },
  { label: "Student Directory", href: "/students", icon: Users },
  { section: "INTERNSHIP", label: "Internships", href: "/internships", icon: Briefcase },
  { label: "Verification Center", href: "/verifications", icon: ShieldCheck },
  { label: "Attendance Audits", href: "/attendance", icon: Clock, tag: "Live" },
  { label: "Progress Tracking", href: "/progress", icon: BarChart3 },
  { section: "SYSTEM", label: "Admin Users", href: "/admin-users", icon: UserCog },
  { label: "Audit Logs", href: "/audit-logs", icon: FileText },
  { label: "System Config", href: "/system-config", icon: Settings },
  { label: "Security & AI", href: "/security", icon: Shield },
];

const COLLEGE_ADMIN_NAV: NavItem[] = [
  { section: "OVERSIGHT", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Departments", href: "/departments", icon: GraduationCap },
  { label: "Dept. Admins", href: "/admin-users", icon: UserCog },
  { label: "Student Directory", href: "/students", icon: Users },
  { section: "INTERNSHIP", label: "Internships", href: "/internships", icon: Briefcase },
  { label: "Verification Queue", href: "/verifications", icon: ShieldCheck },
  { label: "Attendance Audits", href: "/attendance", icon: Clock, tag: "Live" },
  { label: "Progress Monitoring", href: "/progress", icon: BarChart3 },
  { section: "REPORTS", label: "College Reports", href: "/audit-logs", icon: FileText },
];

const DEPT_ADMIN_NAV: NavItem[] = [
  { section: "OVERVIEW", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "My Students", href: "/students", icon: Users },
  { section: "INTERNSHIP", label: "Internships", href: "/internships", icon: Briefcase },
  { label: "Verification Queue", href: "/verifications", icon: ShieldCheck },
  { label: "Attendance", href: "/attendance", icon: Clock, tag: "Live" },
  { label: "Progress Tracking", href: "/progress", icon: BarChart3 },
  { section: "REPORTS", label: "Department Reports", href: "/audit-logs", icon: BookOpen },
];

const roleNavMap: Record<string, NavItem[]> = {
  super_admin: SUPER_ADMIN_NAV,
  college_admin: COLLEGE_ADMIN_NAV,
  department_admin: DEPT_ADMIN_NAV,
  admin: SUPER_ADMIN_NAV,
};

const roleIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  super_admin: Crown,
  college_admin: Award,
  department_admin: BookOpen,
};

const roleGradientMap: Record<string, string> = {
  super_admin: "from-purple-500 via-purple-600 to-indigo-600",
  college_admin: "from-sky-500 via-blue-600 to-blue-700",
  department_admin: "from-emerald-500 via-emerald-600 to-teal-600",
};

export function Sidebar({ pendingReviewCount }: { pendingReviewCount?: number }) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

  const role = user?.role || "department_admin";
  const navItems = roleNavMap[role] || DEPT_ADMIN_NAV;
  const RoleIcon = roleIconMap[role] || BookOpen;
  const gradient = roleGradientMap[role] || roleGradientMap.department_admin;
  const roleColor = ROLE_COLORS[role];
  const roleLabel = ROLE_LABELS[role] || role;

  const itemsWithBadge = navItems.map((item) =>
    item.href === "/verifications"
      ? { ...item, badge: pendingReviewCount && pendingReviewCount > 0 ? pendingReviewCount : undefined }
      : item
  );

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-2xl border-r border-slate-200 flex flex-col h-screen sticky top-0 text-slate-700 z-30 select-none shadow-sm">
      {/* Brand Header */}
      <div className="h-[72px] flex items-center px-5 border-b border-slate-200 gap-3 relative overflow-hidden bg-white">
        <div className="relative shrink-0">
          <div
            className={clsx(
              "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md ring-1 ring-black/5",
              gradient
            )}
          >
            <Terminal className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-slate-900">
              Track<span className="text-sky-600">Intern</span>
            </span>
            <span className="font-mono text-[9px] uppercase px-1 py-0.5 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200">
              v2.4
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <p className="font-mono text-[9px] text-slate-500 tracking-wide uppercase font-semibold">
              LIVE
            </p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className={clsx("mx-3 mt-3 mb-1 px-3 py-2.5 rounded-xl border flex items-center gap-2.5", roleColor?.bg, roleColor?.border)}>
        <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center", roleColor?.bg)}>
          <RoleIcon className={clsx("w-3.5 h-3.5", roleColor?.icon)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider font-bold">Role</p>
          <p className={clsx("text-[11px] font-bold truncate", roleColor?.text)}>{roleLabel}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto">
        {itemsWithBadge.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const showSection = item.section && (idx === 0 || itemsWithBadge[idx - 1]?.section !== item.section);

          return (
            <React.Fragment key={item.href}>
              {showSection && (
                <div className="px-3 pt-3 pb-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <span>{item.section}</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
              )}
              <motion.a
                href={item.href}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                className={clsx(
                  "relative flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all group",
                  isActive
                    ? "bg-sky-50 text-sky-700 border border-sky-200/80 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-sky-500 to-blue-600 rounded-r-full"
                  />
                )}

                <div className="flex items-center gap-2.5">
                  <Icon
                    className={clsx(
                      "w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-105",
                      isActive ? "text-sky-600" : "text-slate-400 group-hover:text-slate-700"
                    )}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>

                <div className="flex items-center gap-1">
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
              </motion.a>
            </React.Fragment>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0 bg-gradient-to-br",
                gradient
              )}
            >
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                {user?.name || "Admin"}
              </p>
              <p className={clsx("font-mono text-[9px] truncate uppercase tracking-wider font-semibold", roleColor?.text)}>
                {roleLabel}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
