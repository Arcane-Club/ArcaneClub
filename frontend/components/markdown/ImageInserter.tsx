"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ImageInserterProps {
  onInsert: (markdown: string) => void;
  onClose: () => void;
}

export function ImageInserter({ onInsert, onClose }: ImageInserterProps) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  const handleSubmit = () => {
    if (!url) return;
    onInsert(`![${alt}](${url})`);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>插入图片</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>图片地址 (URL)</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label>图片描述 (Alt 文本)</Label>
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="图片描述..." />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} disabled={!url}>插入</Button>
      </DialogFooter>
    </>
  );
}
