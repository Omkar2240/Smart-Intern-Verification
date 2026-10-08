/**
 * Colleges page — SSR + client-side management
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { CollegesClient } from "./CollegesClient";
import { PageLoading } from "@/components/UiStates";

export const metadata = {
  title: "College Management — TrackIntern Admin",
  description: "Manage colleges, upload student rosters, and configure college settings.",
};

export default async function CollegesPage() {
  const collegesData = await serverApi.getAdminColleges({ page: 1, page_size: 20 });

  return (
    <Suspense fallback={<PageLoading />}>
      <CollegesClient initialData={collegesData} />
    </Suspense>
  );
}
