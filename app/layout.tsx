import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono, Great_Vibes } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Wedding-card type: a classic serif for headings and a script for the couple's names.
const serif = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["500", "600", "700"] });
const script = Great_Vibes({ variable: "--font-great-vibes", subsets: ["latin"], weight: "400" });

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
      className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} ${script.variable} h-full antialiased`}
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
