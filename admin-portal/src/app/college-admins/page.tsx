/**
 * College Admins page — SSR + real API (delegates to /admin-users?role=college_admin)
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { CollegeAdminsClient } from "./CollegeAdminsClient";
import { PageLoading } from "@/components/UiStates";

export const metadata = {
  title: "College Admins — TrackIntern Admin",
  description: "Manage college-level administrators across the platform.",
};

export default async function CollegeAdminsPage() {
  const [adminsData, colleges] = await Promise.all([
    serverApi.getAdminUsers({ role: "college_admin", page: 1, page_size: 20 }),
    serverApi.getColleges(),
  ]);

  return (
    <Suspense fallback={<PageLoading />}>
      <CollegeAdminsClient initialData={adminsData} colleges={colleges} />
    </Suspense>
  );
}
