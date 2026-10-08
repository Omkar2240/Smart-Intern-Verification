import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrackIntern Admin Console — Biometric & Internship Oversight",
  description:
    "Administrative console for multi-stage verification queues, college whitelist rosters, and attendance audits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="min-h-full bg-[#f8fafc] text-slate-900 antialiased selection:bg-sky-500/20 selection:text-sky-900 bg-ambient-glow bg-fixed"
        suppressHydrationWarning
      >
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </body>
    </html>
  );
}
