/**
 * Verifications page — SSR initial load + client-side filtering & pagination.
 * Server fetches first page; client handles subsequent interactions.
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { VerificationsClient } from "./VerificationsClient";
import { PageLoading } from "@/components/UiStates";

export const metadata = {
  title: "Verification Center — TrackIntern Admin",
  description: "Review and manage student identity verifications.",
};

export default async function VerificationsPage() {
  // SSR: fetch first page while rendering on server
  const initialData = await serverApi.getVerifications({
    page: 1,
    page_size: 20,
  });

  return (
    <Suspense fallback={<PageLoading />}>
      <VerificationsClient initialData={initialData} />
    </Suspense>
  );
}
