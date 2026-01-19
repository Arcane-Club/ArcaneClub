"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Trash2, Shield, ShieldAlert, User as UserIcon, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN" | "MODERATOR";
  avatar: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/users", {
        params: {
          page,
          limit: 10,
          search,
          role: roleFilter === "ALL" ? undefined : roleFilter,
        },
      });
      if (res.data.success) {
        setUsers(res.data.data.users);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await axios.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success("用户角色更新成功");
      // Update local state to reflect change immediately
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (error) {
      console.error("Failed to update role", error);
      toast.error("更新角色失败");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`/admin/users/${userToDelete.id}`);
      toast.success("用户已删除");
      fetchUsers();
      setUserToDelete(null);
    } catch (error) {
      console.error("Failed to delete user", error);
      toast.error("删除用户失败");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> 管理员</Badge>;
      case "MODERATOR":
        return <Badge variant="default" className="bg-blue-600 gap-1"><Shield className="h-3 w-3" /> 版主</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><UserIcon className="h-3 w-3" /> 用户</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
      </div>

      <div className="flex items-center space-x-4">
        <form onSubmit={handleSearch} className="flex-1 flex space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户名或邮箱..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit">搜索</Button>
        </form>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="筛选角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">所有角色</SelectItem>
            <SelectItem value="ADMIN">管理员</SelectItem>
            <SelectItem value="MODERATOR">版主</SelectItem>
            <SelectItem value="USER">普通用户</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  暂无用户
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar ? `http://localhost:3000${user.avatar}` : ""} />
                        <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "yyyy-MM-dd HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Select 
                        value={user.role} 
                        onValueChange={(val) => handleRoleChange(user.id, val)}
                      >
                        <SelectTrigger className="w-[110px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">普通用户</SelectItem>
                          <SelectItem value="MODERATOR">版主</SelectItem>
                          <SelectItem value="ADMIN">管理员</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={() => setUserToDelete(user)}
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

      <div className="flex justify-center gap-2 mt-4">
        <Button
          variant="outline"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          上一页
        </Button>
        <span className="flex items-center px-4 text-sm text-muted-foreground">
          第 {page} / {totalPages} 页
        </span>
        <Button
          variant="outline"
          disabled={page === totalPages || loading}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          下一页
        </Button>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除用户 <strong>{userToDelete?.username}</strong> 及其所有相关数据（帖子、评论等）。
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
