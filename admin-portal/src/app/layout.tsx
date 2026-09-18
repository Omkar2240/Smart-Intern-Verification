import type { Metadata } from "next";
import "./globals.css";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

export const metadata: Metadata = {
  title: "TrackIntern Admin Portal — Biometric & Identity Oversight",
  description: "Administrative console for verification queues, college whitelist rosters, and attendance audits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </body>
    </html>
  );
}
