import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Absolute base for the share image and other metadata URLs.
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: "WedCount",
  description: "WhatsApp RSVPs and an expected headcount for every function of an Indian wedding.",
  openGraph: { siteName: "WedCount", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
        {/* Cookieless page views and Core Web Vitals; both are no-ops outside Vercel. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
