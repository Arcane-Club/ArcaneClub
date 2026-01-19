"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/canvasUtils";

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Crop states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl as string);
      setIsCropDialogOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const readFile = (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const showCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (croppedBlob) {
        const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
        setAvatar(file);
        setAvatarPreview(URL.createObjectURL(croppedBlob));
        setIsCropDialogOpen(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("裁剪失败");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("用户名不能为空");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("bio", bio.trim() || "这个人很懒，什么也没写");
    if (avatar) formData.append("avatar", avatar);

    try {
      const res = await api.put("/users/profile/me", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("个人信息设置成功");
      
      // Update local storage user info
      const updatedUser = res.data.data;
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, ...updatedUser }));
      
      // Redirect to home
      window.location.href = "/";
    } catch (error: any) {
      console.error("Failed to setup profile", error);
      toast.error(error.response?.data?.message || "设置失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>完善个人信息</CardTitle>
          <CardDescription>让我们更好地认识你</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 border relative group cursor-pointer">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">上传头像</div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs">点击修改</span>
                </div>
                <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    title="点击上传头像"
                    onClick={(e) => (e.currentTarget.value = "")}
                />
              </div>
              <span className="text-xs text-gray-500">点击头像上传 (可跳过)</span>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">用户名 <span className="text-red-500">*</span></Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="设置你的用户名"
                required
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">个人简介 (可跳过)</Label>
              <Textarea 
                id="bio" 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="默认为：这个人很懒，什么也没写"
                rows={4}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "保存中..." : "完成设置"}
            </Button>

          </form>
        </CardContent>
      </Card>

      {/* Crop Dialog */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>裁剪头像</DialogTitle>
          </DialogHeader>
          <div className="relative h-96 w-full bg-black">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="flex items-center space-x-4 py-4">
            <span className="text-sm font-medium w-12">缩放</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={showCroppedImage}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
