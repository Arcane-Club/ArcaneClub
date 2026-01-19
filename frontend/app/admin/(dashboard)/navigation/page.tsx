"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import axios from "@/lib/axios";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Navigation {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
  isOpenNewTab: boolean;
  isVisible: boolean;
  createdAt: string;
}

export default function NavigationPage() {
  const [navigations, setNavigations] = useState<Navigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingNav, setEditingNav] = useState<Navigation | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    url: "",
    sortOrder: 0,
    isOpenNewTab: false,
    isVisible: true,
  });

  const fetchNavigations = async () => {
    try {
      const response = await axios.get("/admin/navigations");
      setNavigations(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch navigations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigations();
  }, []);

  const handleOpenDialog = (nav?: Navigation) => {
    if (nav) {
      setEditingNav(nav);
      setFormData({
        label: nav.label,
        url: nav.url,
        sortOrder: nav.sortOrder,
        isOpenNewTab: nav.isOpenNewTab,
        isVisible: nav.isVisible,
      });
    } else {
      setEditingNav(null);
      setFormData({
        label: "",
        url: "",
        sortOrder: 0,
        isOpenNewTab: false,
        isVisible: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNav) {
        await axios.put(`/admin/navigations/${editingNav.id}`, formData);
        toast.success("Navigation updated successfully");
      } else {
        await axios.post("/admin/navigations", formData);
        toast.success("Navigation created successfully");
      }
      setIsDialogOpen(false);
      fetchNavigations();
    } catch (error) {
      toast.error("Failed to save navigation");
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`/admin/navigations/${itemToDelete}`);
      toast.success("Navigation deleted successfully");
      fetchNavigations();
    } catch (error) {
      toast.error("Failed to delete navigation");
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
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
        <h1 className="text-3xl font-bold tracking-tight">导航栏管理</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> 添加导航
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>新标签页打开</TableHead>
              <TableHead>可见性</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {navigations.map((nav) => (
              <TableRow key={nav.id}>
                <TableCell>{nav.label}</TableCell>
                <TableCell>{nav.url}</TableCell>
                <TableCell>{nav.sortOrder}</TableCell>
                <TableCell>{nav.isOpenNewTab ? "是" : "否"}</TableCell>
                <TableCell>{nav.isVisible ? "显示" : "隐藏"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(nav)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(nav.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {navigations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  暂无导航项
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNav ? "编辑导航" : "添加导航"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">名称</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">排序 (越小越靠前)</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sortOrder: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isOpenNewTab"
                checked={formData.isOpenNewTab}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isOpenNewTab: checked })
                }
              />
              <Label htmlFor="isOpenNewTab">在新标签页打开</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isVisible"
                checked={formData.isVisible}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isVisible: checked })
                }
              />
              <Label htmlFor="isVisible">显示</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个导航项吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
