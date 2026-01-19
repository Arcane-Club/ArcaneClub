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
import { toast } from "sonner";
import { Search, Trash2 } from "lucide-react";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  author: {
    username: string;
  };
  post: {
    id: string;
    title: string;
  };
  createdAt: string;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/comments", {
        params: {
          page,
          limit: 10,
          search,
        },
      });
      if (res.data.success) {
        setComments(res.data.data.comments);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch comments", error);
      toast.error("获取评论列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条评论吗？此操作不可恢复。")) return;
    try {
      await api.delete(`/admin/comments/${id}`);
      toast.success("评论删除成功");
      fetchComments();
    } catch (error) {
      toast.error("删除失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">评论管理</h1>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="搜索评论内容..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit">搜索</Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">内容</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>所属帖子</TableHead>
              <TableHead>发布时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  加载中...
                </TableCell>
              </TableRow>
            ) : comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  暂无评论
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="max-w-xs truncate" title={comment.content}>
                    {comment.content}
                  </TableCell>
                  <TableCell>{comment.author.username}</TableCell>
                  <TableCell>
                    <Link href={`/posts/${comment.post.id}`} className="text-blue-600 hover:underline max-w-[200px] truncate block">
                      {comment.post.title}
                    </Link>
                  </TableCell>
                  <TableCell>{format(new Date(comment.createdAt), "yyyy-MM-dd HH:mm")}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(comment.id)}
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
