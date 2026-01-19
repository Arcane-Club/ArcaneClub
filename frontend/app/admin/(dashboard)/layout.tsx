"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== "ADMIN") {
        router.push("/"); // Redirect regular users to home
        return;
      }
      setAuthorized(true);
    } catch (e) {
      router.push("/admin/login");
    }
  }, [router]);

  if (!authorized) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminNavbar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
