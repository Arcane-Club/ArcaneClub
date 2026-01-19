"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "sonner";

export default function DeployPage() {
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    // Fetch current profile to see if already deployed
    api.get("/users/profile/me").then((res) => {
      if (res.data.data.customPagePath) {
        setCurrentPath(res.data.data.customPagePath);
      }
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("htmlFile", file);

    try {
      const res = await api.post("/users/deploy", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("部署成功！");
      setCurrentPath(res.data.data.url);
    } catch (error: any) {
      console.error("Deploy failed", error);
      toast.error(error.response?.data?.message || "部署失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Page 部署</CardTitle>
          <CardDescription>
            上传一个 HTML 文件，我们将为你部署个人静态页面。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {currentPath && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 mb-2">您的页面已部署：</p>
              <a 
                href={`http://localhost:3000${currentPath}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline break-all"
              >
                http://localhost:3000{currentPath} <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>选择 HTML 文件</Label>
              <FileUpload 
                accept=".html" 
                onFileSelect={(f) => setFile(f)} 
                value={file}
                helperText="仅支持 .html 文件，建议命名为 index.html"
              />
            </div>

            <Button type="submit" disabled={loading || !file} className="w-full">
              {loading ? "部署中..." : "上传并部署"}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
