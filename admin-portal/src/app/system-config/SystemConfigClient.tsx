"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Shield,
  Eye,
  Zap,
  Upload,
  Clock,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { api } from "@/lib/api";
import type { SystemConfig } from "@/types/admin";
import { clsx } from "clsx";

interface Props {
  initialConfig: SystemConfig | null;
}

const DEFAULT_CONFIG: SystemConfig = {
  verification_timeout_days: 7,
  max_upload_size_mb: 10,
  allowed_file_types: ["image/jpeg", "image/png", "application/pdf"],
  enable_ocr: true,
  enable_face_recognition: true,
  face_confidence_threshold: 0.85,
};

export function SystemConfigClient({ initialConfig }: Props) {
  const { user } = useAdminAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [config, setConfig] = useState<SystemConfig>(
    initialConfig ? { ...DEFAULT_CONFIG, ...initialConfig } : DEFAULT_CONFIG,
  );
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSavedOk(false);
    try {
      const updated = await api.updateSystemConfig(config);
      setConfig(updated);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save configuration",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleFileType = (type: string) => {
    setConfig((prev) => {
      const currentTypes = prev.allowed_file_types ?? [];
      return {
        ...prev,
        allowed_file_types: currentTypes.includes(type)
          ? currentTypes.filter((t) => t !== type)
          : [...currentTypes, type],
      };
    });
  };

  const FILE_TYPES = [
    { value: "image/jpeg", label: "JPEG" },
    { value: "image/png", label: "PNG" },
    { value: "image/webp", label: "WebP" },
    { value: "application/pdf", label: "PDF" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] bg-ambient-glow">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="System Configuration"
          description="Configure platform-wide verification and processing settings"
          actions={
            isSuperAdmin ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Changes
              </button>
            ) : null
          }
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl space-y-5">
            {/* Success / Error banner */}
            {savedOk && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-[12px] text-emerald-700 font-semibold">
                  Configuration saved successfully
                </p>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <p className="text-[12px] text-rose-700 font-semibold">
                  {error}
                </p>
              </motion.div>
            )}

            {!isSuperAdmin && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">
                  You have <strong>read-only</strong> access to system
                  configuration. Only the Super Administrator can modify these
                  settings.
                </p>
              </div>
            )}

            {/* Verification Settings */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
            >
              <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">
                    Verification Settings
                  </h3>
                  <p className="font-mono text-[10px] text-slate-500">
                    ID verification timeout and face recognition
                  </p>
                </div>
              </div>
              <div className="p-5 space-y-5">
                {/* Timeout */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">
                      Verification Timeout
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Days before a pending verification expires
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      disabled={!isSuperAdmin}
                      value={config.verification_timeout_days}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          verification_timeout_days: +e.target.value,
                        }))
                      }
                      className="w-20 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-center font-bold focus:outline-none focus:border-sky-500 disabled:opacity-60"
                    />
                    <span className="text-[11px] text-slate-500 font-mono">
                      days
                    </span>
                  </div>
                </div>

                {/* Face confidence */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">
                      Face Confidence Threshold
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Minimum score to auto-verify face match (0–1)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0.5}
                      max={0.99}
                      step={0.01}
                      disabled={!isSuperAdmin}
                      value={config.face_confidence_threshold}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          face_confidence_threshold: +e.target.value,
                        }))
                      }
                      className="w-20 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-center font-bold focus:outline-none focus:border-sky-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Toggles */}
                {[
                  {
                    key: "enable_ocr",
                    label: "Enable OCR",
                    desc: "Auto-extract text from ID card images",
                    icon: Eye,
                  },
                  {
                    key: "enable_face_recognition",
                    label: "Enable Face Recognition",
                    desc: "Biometric face matching for verification",
                    icon: Zap,
                  },
                ].map(({ key, label, desc, icon: Icon }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-slate-900">
                          {label}
                        </p>
                        <p className="text-[11px] text-slate-500">{desc}</p>
                      </div>
                    </div>
                    <button
                      disabled={!isSuperAdmin}
                      onClick={() =>
                        setConfig((p) => ({
                          ...p,
                          [key]: !p[key as keyof SystemConfig],
                        }))
                      }
                      className={clsx(
                        "relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60",
                        config[key as keyof SystemConfig]
                          ? "bg-sky-500"
                          : "bg-slate-200",
                      )}
                    >
                      <span
                        className={clsx(
                          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                          config[key as keyof SystemConfig]
                            ? "translate-x-5"
                            : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Upload Settings */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
            >
              <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">
                    File Upload Settings
                  </h3>
                  <p className="font-mono text-[10px] text-slate-500">
                    Max upload size and allowed file types
                  </p>
                </div>
              </div>
              <div className="p-5 space-y-5">
                {/* Max size */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">
                      Max Upload Size
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Maximum file size for ID cards and offer letters
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      disabled={!isSuperAdmin}
                      value={config.max_upload_size_mb}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          max_upload_size_mb: +e.target.value,
                        }))
                      }
                      className="w-20 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-center font-bold focus:outline-none focus:border-sky-500 disabled:opacity-60"
                    />
                    <span className="text-[11px] text-slate-500 font-mono">
                      MB
                    </span>
                  </div>
                </div>

                {/* Allowed file types */}
                <div>
                  <p className="text-[12px] font-semibold text-slate-900 mb-2">
                    Allowed File Types
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FILE_TYPES.map(({ value, label }) => (
                      <button
                        key={value}
                        disabled={!isSuperAdmin}
                        onClick={() => toggleFileType(value)}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl border font-mono text-[11px] font-bold transition-all disabled:opacity-60",
                          (config.allowed_file_types ?? []).includes(value)
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-slate-50 text-slate-500 border-slate-200",
                        )}
                      >
                        {(config.allowed_file_types ?? []).includes(value)
                          ? "✓ "
                          : ""}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
