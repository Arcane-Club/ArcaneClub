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

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().optional(),
  code: z.string().optional(),
  turnstileToken: z.string().min(1, "请完成人机验证"),
  type: z.enum(["PASSWORD", "CODE"]),
}).refine((data) => {
  if (data.type === "PASSWORD" && !data.password) return false;
  if (data.type === "CODE" && !data.code) return false;
  return true;
}, {
  message: "请填写完整信息",
  path: ["password"], 
});

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<"PASSWORD" | "CODE">("PASSWORD");
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
      turnstileToken: "",
      type: "PASSWORD",
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
      await api.post("/auth/send-code", { email, type: "LOGIN" });
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

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setLoading(true);
      values.type = loginType;
      
      const res = await api.post("/auth/login", values);
      const { token, user } = res.data.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.response?.data?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">登录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex mb-6 border rounded-md overflow-hidden">
            <button
              className={`flex-1 py-2 text-sm font-medium ${loginType === "PASSWORD" ? "bg-blue-50 text-blue-600" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              onClick={() => { setLoginType("PASSWORD"); form.setValue("type", "PASSWORD"); }}
              type="button"
            >
              密码登录
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${loginType === "CODE" ? "bg-blue-50 text-blue-600" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              onClick={() => { setLoginType("CODE"); form.setValue("type", "CODE"); }}
              type="button"
            >
              验证码登录
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱</label>
              <Input {...form.register("email")} placeholder="name@example.com" />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            {loginType === "PASSWORD" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">密码</label>
                <Input {...form.register("password")} type="password" placeholder="********" />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">验证码</label>
                <div className="flex gap-2">
                  <Input {...form.register("code")} placeholder="6位数字验证码" maxLength={6} />
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
                {form.formState.errors.code && (
                  <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
                )}
              </div>
            )}

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
              {loading ? "登录中..." : "登录"}
            </Button>

            <div className="text-center text-sm text-gray-500">
              还没有账号？ <Link href="/auth/register" className="text-blue-600 hover:underline">去注册</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
