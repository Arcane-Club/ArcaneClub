"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Edit, Trash2, Plus, Layers } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Board {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  categoryId: string;
  category: Category;
}

export default function AdminBoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    sortOrder: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [boardsRes, categoriesRes] = await Promise.all([
        api.get("/admin/boards"),
        api.get("/admin/categories"),
      ]);
      
      if (boardsRes.data.success) {
        setBoards(boardsRes.data.data);
      }
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingBoard(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      categoryId: categories[0]?.id || "",
      sortOrder: 0,
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (board: Board) => {
    setEditingBoard(board);
    setFormData({
      name: board.name,
      slug: board.slug,
      description: board.description || "",
      categoryId: board.categoryId,
      sortOrder: board.sortOrder,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBoard) {
        await api.put(`/admin/boards/${editingBoard.id}`, formData);
        toast.success("板块更新成功");
      } else {
        await api.post("/admin/boards", formData);
        toast.success("板块创建成功");
      }
      setIsOpen(false);
      fetchData();
    } catch (error) {
      toast.error("操作失败，请检查Slug是否重复");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个板块吗？此操作不可恢复。")) return;
    try {
      await api.delete(`/admin/boards/${id}`);
      toast.success("删除成功");
      fetchData();
    } catch (error) {
      toast.error("删除失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">板块管理</h1>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新建板块
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>所属分类</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>排序</TableHead>
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
            ) : boards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  暂无板块
                </TableCell>
              </TableRow>
            ) : (
              boards.map((board) => (
                <TableRow key={board.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4 text-gray-400" />
                    {board.name}
                  </TableCell>
                  <TableCell>{board.slug}</TableCell>
                  <TableCell>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs">
                      {board.category.name}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={board.description || ""}>
                    {board.description || "-"}
                  </TableCell>
                  <TableCell>{board.sortOrder}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => handleOpenEdit(board)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(board.id)}
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBoard ? "编辑板块" : "新建板块"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">板块名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL路径)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">所属分类</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">排序权重 (越小越靠前)</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                取消
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
