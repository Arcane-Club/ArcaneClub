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
import { Trash2, Plus } from "lucide-react";

interface BannedWord {
  id: string;
  word: string;
  createdAt: string;
}

export default function AdminBannedWordsPage() {
  const [words, setWords] = useState<BannedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState("");

  const fetchWords = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/banned-words");
      if (res.data.success) {
        setWords(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch banned words", error);
      toast.error("获取违禁词列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    try {
      await api.post("/admin/banned-words", { word: newWord.trim() });
      toast.success("违禁词添加成功");
      setNewWord("");
      fetchWords();
    } catch (error) {
      toast.error("添加失败，可能该词已存在");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个违禁词吗？")) return;
    try {
      await api.delete(`/admin/banned-words/${id}`);
      toast.success("删除成功");
      fetchWords();
    } catch (error) {
      toast.error("删除失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">违禁词管理</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <form onSubmit={handleAdd} className="flex gap-4 items-end max-w-md">
          <div className="flex-1 space-y-2">
            <label htmlFor="word" className="text-sm font-medium text-gray-700">
              添加新违禁词
            </label>
            <Input
              id="word"
              placeholder="输入违禁词..."
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
            />
          </div>
          <Button type="submit">
            <Plus className="h-4 w-4 mr-2" />
            添加
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>违禁词</TableHead>
              <TableHead>添加时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  加载中...
                </TableCell>
              </TableRow>
            ) : words.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  暂无违禁词
                </TableCell>
              </TableRow>
            ) : (
              words.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.word}</TableCell>
                  <TableCell>{format(new Date(item.createdAt), "yyyy-MM-dd HH:mm")}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(item.id)}
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
    </div>
  );
}
