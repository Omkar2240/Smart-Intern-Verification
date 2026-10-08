/**
 * Students page — SSR data loading with client-side interaction controls.
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { StudentsClient } from "./StudentsClient";
import { PageLoading } from "@/components/UiStates";
import type { Department } from "@/types/admin";

export const metadata = {
  title: "Student Directory — TrackIntern Admin",
  description: "Browse and filter registered students across colleges and departments.",
};

export default async function StudentsPage() {
  const [studentsData, colleges, currentUser] = await Promise.all([
    serverApi.getStudents({ page: 1, page_size: 20 }),
    serverApi.getColleges(),
    serverApi.getCurrentUser(),
  ]);
  let departments: Department[] = [];
  if (currentUser?.college_id) {
    departments = await serverApi.getDepartments({ college_id: currentUser.college_id });
  } else if (currentUser) {
    departments = await serverApi.getDepartments();
  }

  return (
    <Suspense fallback={<PageLoading />}>
      <StudentsClient initialData={studentsData} colleges={colleges} departments={departments} />
    </Suspense>
  );
}
