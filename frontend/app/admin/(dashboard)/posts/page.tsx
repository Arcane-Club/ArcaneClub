"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Trash2, CheckCircle, XCircle } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    username: string;
  };
  board: {
    name: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/posts", {
        params: {
          page,
          limit: 10,
          search,
          status: status === "ALL" ? undefined : status,
        },
      });
      if (res.data.success) {
        setPosts(res.data.data.posts);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
      toast.error("获取帖子列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/posts/${id}/status`, { status: newStatus });
      toast.success("状态更新成功");
      fetchPosts();
    } catch (error) {
      toast.error("状态更新失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个帖子吗？此操作不可恢复。")) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      toast.success("帖子删除成功");
      fetchPosts();
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-500">已通过</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">已拒绝</Badge>;
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-500 text-white">待审核</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">帖子管理</h1>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="搜索标题或内容..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit">搜索</Button>
        </form>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部状态</SelectItem>
            <SelectItem value="PENDING">待审核</SelectItem>
            <SelectItem value="APPROVED">已通过</SelectItem>
            <SelectItem value="REJECTED">已拒绝</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>板块</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>发布时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  加载中...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  暂无帖子
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-xs truncate" title={post.title}>
                    {post.title}
                  </TableCell>
                  <TableCell>{post.author.username}</TableCell>
                  <TableCell>{post.board.name}</TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>{format(new Date(post.createdAt), "yyyy-MM-dd HH:mm")}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {post.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleUpdateStatus(post.id, "APPROVED")}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleUpdateStatus(post.id, "REJECTED")}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
