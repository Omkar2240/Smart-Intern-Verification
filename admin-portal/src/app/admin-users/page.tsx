/**
 * Admin Users page — SSR + client interactivity
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { AdminUsersClient } from "./AdminUsersClient";
import { PageLoading } from "@/components/UiStates";

export const metadata = {
  title: "Admin Users — TrackIntern Admin",
  description: "Manage platform administrators, college admins, and department admins.",
};

export default async function AdminUsersPage() {
  const [adminsData, colleges] = await Promise.all([
    serverApi.getAdminUsers({ page: 1, page_size: 20 }),
    serverApi.getColleges(),
  ]);

  return (
    <Suspense fallback={<PageLoading />}>
      <AdminUsersClient initialData={adminsData} colleges={colleges} />
    </Suspense>
  );
}
