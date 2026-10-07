/**
 * Internships page — SSR + client-side filtering
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { InternshipsClient } from "./InternshipsClient";
import { PageLoading } from "@/components/UiStates";

export const metadata = {
  title: "Internships — TrackIntern Admin",
  description: "Review and manage student internship verifications.",
};

export default async function InternshipsPage() {
  const [internshipsData, colleges] = await Promise.all([
    serverApi.getAdminInternships({ page: 1, page_size: 20 }),
    serverApi.getColleges(),
  ]);

  return (
    <Suspense fallback={<PageLoading />}>
      <InternshipsClient initialData={internshipsData} colleges={colleges} />
    </Suspense>
  );
}
