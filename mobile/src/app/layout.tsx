import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "D-Campus Mobile | COER University Academic Hub",
  description: "Unified Zero-CAPTCHA Neo-Brutalist Mobile Portal for Attendance, Timetable & Notes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "D-Campus",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b0f19",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="icon" href="/icons/icon-128.png" />
        <link rel="apple-touch-icon" href="/icons/icon-128.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0b0f19] text-[#f3f4f6]">
        {children}
      </body>
    </html>
  );
}
