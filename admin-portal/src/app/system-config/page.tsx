/**
 * System Config page — SSR
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { SystemConfigClient } from "./SystemConfigClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "System Configuration — TrackIntern Admin",
  description: "Configure platform-wide system settings.",
};

export default async function SystemConfigPage() {
  const config = await serverApi.getSystemConfig();

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    }>
      <SystemConfigClient initialConfig={config} />
    </Suspense>
  );
}
