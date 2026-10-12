import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app-shell";
import WebVitals from "@/components/web-vitals";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CampusOps · Your campus, connected",
  description:
    "A shared workspace for campus organizations, events, programs, and the people who make them happen.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body>
        <WebVitals />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
