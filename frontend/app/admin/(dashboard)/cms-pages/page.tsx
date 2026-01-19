"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

interface Page {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
}

export default function CMSPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    try {
      const response = await axios.get("/admin/cms-pages");
      setPages(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await axios.delete(`/admin/cms-pages/${id}`);
      toast.success("Page deleted successfully");
      fetchPages();
    } catch (error) {
      toast.error("Failed to delete page");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">页面管理</h1>
        <Link href="/admin/cms-pages/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> 新建页面
          </Button>
        </Link>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell>{page.title}</TableCell>
                <TableCell>{page.slug}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      page.published
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {page.published ? "已发布" : "草稿"}
                  </span>
                </TableCell>
                <TableCell>
                  {format(new Date(page.updatedAt), "yyyy-MM-dd HH:mm")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/pages/${page.slug}`} target="_blank">
                        <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={`/admin/cms-pages/${page.id}`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(page.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pages.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  暂无页面
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
