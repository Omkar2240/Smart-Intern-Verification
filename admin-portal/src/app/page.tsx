/**
 * Root Dashboard — SSR entry point.
 * Fetches analytics data server-side per role, then hydrates the correct dashboard component.
 */
import { Suspense } from "react";
import { serverApi } from "@/lib/serverApi";
import { DashboardShell } from "@/components/DashboardShell";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Dashboard — TrackIntern Admin",
  description: "Internship verification and student management dashboard.",
};

export default async function DashboardPage() {
  // Fetch all data in parallel on the server
  const [analytics, attendanceAnalytics, departments, recentStudents] = await Promise.all([
    serverApi.getAnalyticsSummary(),
    serverApi.getAttendanceAnalytics(),
    serverApi.getDepartments(),
    serverApi.getStudents({ page: 1, page_size: 5 }),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
            </div>
            <p className="font-mono text-xs text-slate-500">Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardShell
        analytics={analytics}
        attendanceAnalytics={attendanceAnalytics}
        departments={departments}
        recentStudents={recentStudents?.items ?? []}
      />
    </Suspense>
  );
}
