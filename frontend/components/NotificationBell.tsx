"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/axios";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  relatedLink: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: string, link?: string) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      
      const wasUnread = notifications.find(n => n.id === id && !n.isRead);
      if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      await api.put(`/notifications/${id}/read`);
      if(link) {
          setIsOpen(false);
      }
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await api.put(`/notifications/all/read`);
    } catch (error) {
      console.error("Failed to mark all read", error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">通知</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto text-xs text-blue-600 px-2" onClick={handleMarkAllRead}>
              全部已读
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">暂无通知</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "px-4 py-3 border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer",
                  !notification.isRead && "bg-blue-50/50"
                )}
                onClick={() => handleMarkRead(notification.id)}
              >
                <Link href={notification.relatedLink || "#"} className="block" onClick={(e) => {
                    if (!notification.relatedLink) e.preventDefault();
                    handleMarkRead(notification.id, notification.relatedLink);
                }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-gray-900">{notification.title}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: zhCN })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{notification.content}</p>
                </Link>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
