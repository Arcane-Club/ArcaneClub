"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/canvasUtils";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  initialData: any;
}

export function ProfileSettingsDialog({ 
  open, 
  onOpenChange, 
  onUpdate,
  initialData 
}: ProfileSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [background, setBackground] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);

  // Crop states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'background'>('avatar');

  useEffect(() => {
    if (initialData && open) {
      setUsername(initialData.username || "");
      setBio(initialData.bio || "");
      if (initialData.avatar) setAvatarPreview(`http://localhost:3000${initialData.avatar}`);
      if (initialData.backgroundImage) setBackgroundPreview(`http://localhost:3000${initialData.backgroundImage}`);
      // Reset files
      setAvatar(null);
      setBackground(null);
    }
  }, [initialData, open]);

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
      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0 // rotation
      );
      if (croppedBlob) {
        const fileName = cropType === 'avatar' ? "avatar.jpg" : "background.jpg";
        const file = new File([croppedBlob], fileName, { type: "image/jpeg" });
        
        if (cropType === 'avatar') {
          setAvatar(file);
          setAvatarPreview(URL.createObjectURL(croppedBlob));
        } else {
          setBackground(file);
          setBackgroundPreview(URL.createObjectURL(croppedBlob));
        }
        
        setIsCropDialogOpen(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("裁剪失败");
    }
  };

  const handleFileSelect = async (file: File | null, type: 'avatar' | 'background') => {
      if (file) {
        const imageDataUrl = await readFile(file);
        setImageSrc(imageDataUrl as string);
        setCropType(type);
        setIsCropDialogOpen(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("bio", bio);
    if (avatar) formData.append("avatar", avatar);
    if (background) formData.append("backgroundImage", background);

    try {
      const res = await api.put("/users/profile/me", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("更新成功");
      
      // Update local storage user info
      const updatedUser = res.data.data;
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, ...updatedUser }));
      
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to update profile", error);
      toast.error(error.response?.data?.message || "更新失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>账户信息设置</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-6 py-4">
          
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="设置你的用户名"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">个人简介</Label>
            <Textarea 
              id="bio" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="介绍一下你自己..."
              rows={4}
            />
          </div>

          {/* Avatar */}
          <div className="space-y-2">
            <Label>头像</Label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-200 border relative flex-shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">无头像</div>
                )}
              </div>
              <div className="flex-1">
                 <FileUpload 
                    accept="image/*"
                    onFileSelect={(f) => handleFileSelect(f, 'avatar')}
                    helperText="点击上传头像"
                    className="min-h-[100px]"
                 />
              </div>
            </div>
          </div>

          {/* Background Image */}
          <div className="space-y-2">
            <Label>个人主页背景图</Label>
            <div className="w-full h-32 rounded-md overflow-hidden bg-gray-200 border mb-2 relative">
                {backgroundPreview ? (
                  <img src={backgroundPreview} alt="Background Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">无背景图</div>
                )}
            </div>
             <FileUpload 
                accept="image/*"
                onFileSelect={(f) => handleFileSelect(f, 'background')}
                helperText="点击上传背景图"
                className="min-h-[100px]"
             />
          </div>

          <DialogFooter>
             <Button type="submit" disabled={loading}>
               {loading ? "保存中..." : "保存更改"}
             </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>

    {/* Crop Dialog */}
    <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{cropType === 'avatar' ? '裁剪头像' : '裁剪背景图'}</DialogTitle>
          </DialogHeader>
          <div className="relative h-96 w-full bg-black">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropType === 'avatar' ? 1 : 3}
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
            <Button variant="outline" onClick={() => setIsCropDialogOpen(false)}>取消</Button>
            <Button onClick={showCroppedImage}>确认裁剪</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
