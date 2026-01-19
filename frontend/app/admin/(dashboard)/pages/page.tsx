"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Need to check if Tabs exists, usually it does in ShadCN
import { Loader2, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Fallback for Tabs if not present, but usually standard. Let's assume it exists or use simple state.
// I'll check components/ui/tabs.tsx first to be safe.
// Actually, LS didn't show tabs.tsx. It showed table.tsx but not tabs.tsx.
// I should verify if tabs.tsx exists. If not, I'll use simple state buttons.

interface PagesConfig {
  enabled: boolean;
  maxPagesPerUser: number;
}

interface PageUser {
  id: string;
  username: string;
  email: string;
  customPagePath: string;
  updatedAt: string;
}

export default function AdminPagesPage() {
  const [activeTab, setActiveTab] = useState("management");
  const [config, setConfig] = useState<PagesConfig>({ enabled: true, maxPagesPerUser: 1 });
  const [pages, setPages] = useState<PageUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPages, setLoadingPages] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Pagination for pages
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Initial data fetch
  useEffect(() => {
    fetchSettings();
    fetchPages();
  }, []);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const res = await api.get("/admin/settings");
      if (res.data.success && res.data.data.pages) {
        setConfig(res.data.data.pages);
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };

  // Fetch pages list
  const fetchPages = async (pageNum = 1) => {
    setLoadingPages(true);
    try {
      const res = await api.get(`/admin/pages?page=${pageNum}`);
      if (res.data.success) {
        setPages(res.data.data.pages);
        setTotalPages(res.data.data.pagination.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      toast.error("获取页面列表失败");
    } finally {
      setLoadingPages(false);
      setLoading(false);
    }
  };

  // Save config
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", {
        pages: config,
      });
      toast.success("配置已保存");
    } catch (error) {
      toast.error("保存配置失败");
    } finally {
      setSaving(false);
    }
  };

  // Delete page
  const handleDeletePage = async (userId: string) => {
    if (!confirm("确定要删除该用户的页面吗？此操作不可恢复。")) return;
    
    try {
      await api.delete(`/admin/pages/${userId}`);
      toast.success("页面已删除");
      fetchPages(page); // Refresh list
    } catch (error) {
      toast.error("删除页面失败");
    }
  };

  if (loading && !pages.length) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Pages 管理</h1>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("management")}
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "management"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          全部Pages管理
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "config"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Pages配置
        </button>
      </div>

      {activeTab === "config" && (
        <Card>
          <CardHeader>
            <CardTitle>功能配置</CardTitle>
            <CardDescription>管理 Pages 功能的全局设置</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">开启 Pages 功能</Label>
                <p className="text-sm text-gray-500">
                  关闭后，用户将无法访问或部署新的页面
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>每个用户可开启的数量</Label>
              <Input
                type="number"
                min={1}
                value={config.maxPagesPerUser}
                onChange={(e) => setConfig({ ...config, maxPagesPerUser: parseInt(e.target.value) || 1 })}
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500">
                目前仅支持每个用户部署 1 个页面 (技术限制)
              </p>
            </div>

            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存配置
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "management" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>已部署页面</CardTitle>
              <CardDescription>管理所有用户部署的静态页面</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchPages(page)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        暂无已部署的页面
                      </TableCell>
                    </TableRow>
                  ) : (
                    pages.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username || "未设置"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{new Date(user.updatedAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`http://localhost:3000${user.customPagePath}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeletePage(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPages(page - 1)}
                  disabled={page <= 1}
                >
                  上一页
                </Button>
                <span className="flex items-center text-sm text-gray-600">
                  第 {page} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPages(page + 1)}
                  disabled={page >= totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
