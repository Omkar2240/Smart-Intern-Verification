/**
 * Students page — SSR + client-side filtering & pagination
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { StudentsClient } from "./StudentsClient";
import { PageLoading } from "@/components/UiStates";

export const metadata = {
  title: "Student Directory — TrackIntern Admin",
  description: "Browse and filter registered students across colleges and departments.",
};

export default async function StudentsPage() {
  const [studentsData, colleges] = await Promise.all([
    serverApi.getStudents({ page: 1, page_size: 20 }),
    serverApi.getColleges(),
  ]);

  return (
    <Suspense fallback={<PageLoading />}>
      <StudentsClient initialData={studentsData} colleges={colleges} />
    </Suspense>
  );
}
