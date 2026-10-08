/**
 * Departments page — SSR initial data fetch + client-side interactivity.
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { DepartmentsClient } from "./DepartmentsClient";
import { PageLoading } from "@/components/UiStates";

export const metadata = {
  title: "Departments — TrackIntern Admin",
  description: "Manage departments across colleges.",
};

export default async function DepartmentsPage() {
  const [departments, colleges] = await Promise.all([
    serverApi.getDepartments(),
    serverApi.getColleges(),
  ]);

  return (
    <Suspense fallback={<PageLoading />}>
      <DepartmentsClient initialDepartments={departments} colleges={colleges} />
    </Suspense>
  );
}
