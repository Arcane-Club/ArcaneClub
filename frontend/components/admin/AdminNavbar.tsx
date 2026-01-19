"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export function AdminNavbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    } catch (e) {
      console.error("Failed to parse user data", e);
    }
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center">
        {/* Breadcrumbs or Title could go here */}
        <h2 className="text-lg font-semibold text-gray-800">后台管理系统</h2>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {user?.username || "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}
