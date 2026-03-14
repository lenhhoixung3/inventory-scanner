import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  title: "Inventory Scanner PRO",
  description: "Hệ thống quản lý kho thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900 pb-16`}
      >
        <main className="max-w-lg mx-auto bg-white min-h-screen shadow-2xl pb-16">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
