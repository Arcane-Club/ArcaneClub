import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arcane Club",
  description: "A modern community forum",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
