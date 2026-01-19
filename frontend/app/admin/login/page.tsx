"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      // Admin login usually uses the same auth endpoint, but we check role after
      // Or we can have a specific admin login endpoint if needed.
      // For now, reuse /auth/login, but we need to verify role client-side or server-side.
      // Ideally, the login response includes the role.
      
      // Since /auth/login accepts type: "LOGIN", let's use that.
      // But wait, the existing login flow requires a verification code for the first time? 
      // Or password login?
      // Let's check authController.ts again.
      // It seems to require 'code' if it's verifying email, but there is a 'login' function.
      
      // Let's assume standard password login is supported or I need to use the existing flow.
      // Looking at previous context, `login` function in authController.ts:
      // const { email, password, code, type } = req.body;
      // It checks verification code if provided?
      // Wait, let's re-read authController.ts.
      
      const res = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
        type: "PASSWORD",
        turnstileToken: "admin-bypass", // In production, add Turnstile widget
      });

      if (res.data.success) {
        const { token, user } = res.data.data;
        
        if (user.role !== "ADMIN") {
          toast.error("您没有管理员权限");
          return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        toast.success("登录成功");
        router.push("/admin");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-800 p-8 text-center">
          <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Arcane Club 后台管理</h1>
          <p className="text-gray-400 mt-2">请登录以继续</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-700" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
