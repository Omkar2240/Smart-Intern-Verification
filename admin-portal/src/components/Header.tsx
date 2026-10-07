"use client";

import React from "react";
import { Bell, Clock, Crown, Award, BookOpen } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ROLE_LABELS } from "@/constants/roles.constants";
import { clsx } from "clsx";
import { motion } from "framer-motion";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const roleDisplayMap: Record<
  string,
  {
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    border: string;
  }
> = {
  super_admin: {
    label: "SUPER ADMIN",
    sublabel: "System Wide",
    icon: Crown,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  college_admin: {
    label: "COLLEGE ADMIN",
    sublabel: "Middle Level",
    icon: Award,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  department_admin: {
    label: "DEPT. ADMIN",
    sublabel: "Department Level",
    icon: BookOpen,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
};

function LiveClock() {
  const [time, setTime] = React.useState(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted || !time) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
        <Clock className="w-3 h-3" />
        <span>--:--:-- UTC+5:30</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
      <Clock className="w-3 h-3" />
      <span>
        {time.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}{" "}
        UTC+5:30
      </span>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping ml-0.5" />
      <span className="font-bold text-emerald-700">LIVE</span>
    </div>
  );
}

export function Header({ title, description, actions }: HeaderProps) {
  const { user } = useAdminAuth();
  const role = user?.role || "department_admin";
  const roleDisplay = roleDisplayMap[role] || roleDisplayMap.department_admin;
  const RoleIcon = roleDisplay.icon;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="h-[72px] bg-white/95 backdrop-blur-sm border-b border-slate-200 flex items-center px-7 gap-5 shadow-xs sticky top-0 z-20"
    >
      {/* Title Section */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[15px] font-extrabold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          <div
            className={clsx(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
              roleDisplay.bg,
              roleDisplay.border,
            )}
          >
            <RoleIcon className={clsx("w-3 h-3", roleDisplay.color)} />
            <span
              className={clsx(
                "font-mono text-[9px] font-bold uppercase tracking-wider",
                roleDisplay.color,
              )}
            >
              {roleDisplay.label}
            </span>
          </div>
        </div>
        {description && (
          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-lg">
            {description}
          </p>
        )}
      </div>

      {/* Center: Live Clock */}
      <div className="hidden lg:flex items-center px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
        <LiveClock />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2.5">
        {actions}

        {/* Notification bell */}
        <button className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200">
          <div
            className={clsx(
              "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white bg-gradient-to-br shadow-sm",
              role === "super_admin"
                ? "from-purple-500 to-indigo-600"
                : role === "college_admin"
                  ? "from-sky-500 to-blue-600"
                  : "from-emerald-500 to-teal-600",
            )}
          >
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="hidden sm:block">
            <p className="text-[11px] font-bold text-slate-900 leading-tight">
              {user?.name || "Admin"}
            </p>
            <p
              className={clsx(
                "font-mono text-[9px] uppercase font-semibold",
                roleDisplay.color,
              )}
            >
              {roleDisplay.sublabel}
            </p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
