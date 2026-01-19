"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  userCount: number;
  postCount: number;
  commentCount: number;
}

interface RecentUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface RecentPost {
  id: string;
  title: string;
  author: {
    username: string;
  };
  board: {
    name: string;
  };
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    userCount: 0,
    postCount: 0,
    commentCount: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/dashboard");
        if (res.data.success) {
          setStats(res.data.data.stats);
          setRecentUsers(res.data.data.recentUsers);
          setRecentPosts(res.data.data.recentPosts);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">仪表盘概览</h1>
      
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
            <p className="text-xs text-muted-foreground">活跃社区成员</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总帖子数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postCount}</div>
            <p className="text-xs text-muted-foreground">社区内容贡献</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总评论数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.commentCount}</div>
            <p className="text-xs text-muted-foreground">互动交流</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>最新注册用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium leading-none">{user.username || "匿名用户"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(user.createdAt), "yyyy-MM-dd")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>最新发布帖子</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between">
                  <div className="max-w-[70%]">
                    <p className="text-sm font-medium leading-none truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {post.author.username || "匿名"} in {post.board.name}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(post.createdAt), "yyyy-MM-dd")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
