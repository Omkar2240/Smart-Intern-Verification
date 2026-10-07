/**
 * Attendance page — SSR + client-side filtering
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { AttendanceClient } from "./AttendanceClient";
import { PageLoading } from "@/components/UiStates";

export const metadata = {
  title: "Attendance Monitoring — TrackIntern Admin",
  description: "View and analyze student attendance records.",
};

export default async function AttendancePage() {
  const [attendanceData, analytics] = await Promise.all([
    serverApi.getAttendance({ page: 1, page_size: 20 }),
    serverApi.getAttendanceAnalytics(),
  ]);

  return (
    <Suspense fallback={<PageLoading />}>
      <AttendanceClient initialData={attendanceData} initialAnalytics={analytics} />
    </Suspense>
  );
}
