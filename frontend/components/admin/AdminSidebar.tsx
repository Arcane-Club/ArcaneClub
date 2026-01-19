"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Shield,
  MessageSquare,
  Ban,
  Layers,
  ChevronDown,
  ChevronRight,
  Menu,
} from "lucide-react";

const sidebarGroups = [
  {
    title: "概览",
    items: [
      {
        title: "仪表盘",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "内容管理",
    items: [
      {
        title: "帖子管理",
        href: "/admin/posts",
        icon: FileText,
      },
      {
        title: "评论管理",
        href: "/admin/comments",
        icon: MessageSquare,
      },
      {
        title: "板块管理",
        href: "/admin/boards",
        icon: Layers,
      },
      {
        title: "页面管理",
        href: "/admin/cms-pages",
        icon: FileText,
      },
    ],
  },
  {
    title: "用户与安全",
    items: [
      {
        title: "用户管理",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "违禁词管理",
        href: "/admin/banned-words",
        icon: Ban,
      },
    ],
  },
  {
    title: "系统",
    items: [
      {
        title: "导航栏管理",
        href: "/admin/navigation",
        icon: Menu,
      },
      {
        title: "系统设置",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
  {
    title: "其他页面",
    items: [
      {
        title: "Pages",
        href: "/admin/pages",
        icon: FileText,
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  // State to track expanded groups. Initialize with groups that contain the active path.
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    return sidebarGroups
      .filter((group) => group.items.some((item) => pathname === item.href))
      .map((group) => group.title);
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <Shield className="h-6 w-6 text-blue-500 mr-2" />
        <span className="font-bold text-lg">Arcane Admin</span>
      </div>

      <div className="flex-1 py-6 px-3 space-y-4 overflow-y-auto">
        {sidebarGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.title);
          const isActiveGroup = group.items.some((item) => pathname === item.href);
          
          return (
            <div key={group.title}>
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
              >
                <span>{group.title}</span>
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              
              {isExpanded && (
                <div className="space-y-1 mt-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ml-2",
                        pathname === item.href
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      )}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/admin/login";
          }}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          退出登录
        </button>
      </div>
    </div>
  );
}
