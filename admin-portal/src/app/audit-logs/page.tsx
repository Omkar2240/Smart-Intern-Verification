/**
 * Audit Logs page — SSR + client-side filtering
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { AuditLogsClient } from "./AuditLogsClient";
import { PageLoading } from "@/components/UiStates";

export const metadata = {
  title: "Audit Logs — TrackIntern Admin",
  description: "Security monitoring and admin activity audit trail.",
};

export default async function AuditLogsPage() {
  const initialData = await serverApi.getAuditLogs({ page: 1, page_size: 20 });

  return (
    <Suspense fallback={<PageLoading />}>
      <AuditLogsClient initialData={initialData} />
    </Suspense>
  );
}
