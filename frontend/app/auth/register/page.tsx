"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  code: z.string().length(6, "验证码必须是6位数字"),
  password: z.string().min(8, "密码至少8位"),
  confirmPassword: z.string(),
  turnstileToken: z.string().min(1, "请完成人机验证"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      code: "",
      password: "",
      confirmPassword: "",
      turnstileToken: "",
    },
  });

  const sendCode = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "请先输入邮箱" });
      return;
    }
    
    const emailResult = await form.trigger("email");
    if(!emailResult) return;

    try {
      setSendingCode(true);
      await api.post("/auth/send-code", { email, type: "REGISTER" });
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      toast.success("验证码已发送");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "发送失败");
    } finally {
      setSendingCode(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      setLoading(true);
      const res = await api.post("/auth/register", {
        email: values.email,
        password: values.password,
        code: values.code,
        turnstileToken: values.turnstileToken,
      });
      
      const { token, user } = res.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("注册成功，请完善个人信息");
      router.push("/auth/setup");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">注册账号</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱</label>
              <div className="flex gap-2">
                <Input {...form.register("email")} placeholder="name@example.com" />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={sendCode}
                  disabled={sendingCode || countdown > 0}
                  className="w-32"
                >
                  {countdown > 0 ? `${countdown}s` : sendingCode ? "发送中" : "获取验证码"}
                </Button>
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">验证码</label>
              <Input {...form.register("code")} placeholder="6位数字验证码" maxLength={6} />
              {form.formState.errors.code && (
                <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">密码</label>
              <Input {...form.register("password")} type="password" placeholder="********" />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">确认密码</label>
              <Input {...form.register("confirmPassword")} type="password" placeholder="********" />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex justify-center py-2">
              <Turnstile 
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"} 
                onSuccess={(token) => form.setValue("turnstileToken", token)} 
              />
            </div>
             {form.formState.errors.turnstileToken && (
                <p className="text-sm text-red-500 text-center">{form.formState.errors.turnstileToken.message}</p>
              )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>

            <div className="text-center text-sm text-gray-500">
              已有账号？ <Link href="/auth/login" className="text-blue-600 hover:underline">去登录</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
