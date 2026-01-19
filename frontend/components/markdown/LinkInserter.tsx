"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LinkInserterProps {
  onInsert: (markdown: string) => void;
  onClose: () => void;
}

export function LinkInserter({ onInsert, onClose }: LinkInserterProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!url) return;
    const linkText = text || url;
    onInsert(`[${linkText}](${url})`);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>插入链接</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>链接地址 (URL)</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label>链接文字</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="显示文字..." />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} disabled={!url}>插入</Button>
      </DialogFooter>
    </>
  );
}
