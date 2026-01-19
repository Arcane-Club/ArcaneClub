"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { LogOut, User, Settings, FileCode, Home } from "lucide-react";
import axios from "@/lib/axios";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./NotificationBell";

export function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [navigations, setNavigations] = useState<any[]>([]);

  if (pathname?.startsWith("/admin")) return null;

  useEffect(() => {
    // Fetch navigations
    const fetchNavigations = async () => {
      try {
        const response = await axios.get("/misc/navigations");
        setNavigations(response.data.data);
      } catch (error) {
        console.error("Failed to fetch navigations", error);
      }
    };
    fetchNavigations();

    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (token) {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(userData);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    window.location.href = "/";
  };

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/" className="font-bold text-2xl mr-6 text-blue-600">
          Arcane Club
        </Link>
        <div className="flex items-center space-x-6 text-sm font-medium text-gray-600">
          {navigations.map((nav) => (
            <Link
              key={nav.id}
              href={nav.url}
              className="hover:text-blue-600"
              target={nav.isOpenNewTab ? "_blank" : "_self"}
              rel={nav.isOpenNewTab ? "noopener noreferrer" : undefined}
            >
              {nav.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <Link href="/posts/create">
                <Button size="sm" className="mr-2">发布帖子</Button>
              </Link>
              
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
                    {user?.avatar ? (
                      <img src={`http://localhost:3000${user.avatar}`} alt="Avatar" className="h-8 w-8 object-cover" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/users/${user?.id}`}>
                      <Home className="mr-2 h-4 w-4" /> 个人主页
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/users/${user?.id}?settings=true`}>
                      <Settings className="mr-2 h-4 w-4" /> 账户信息
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/deploy">
                      <FileCode className="mr-2 h-4 w-4" /> Page 部署
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> 登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost">登录</Button>
              </Link>
              <Link href="/auth/register">
                <Button>注册</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
