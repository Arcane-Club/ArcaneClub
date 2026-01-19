"use client";

import { 
  Bold, Italic, Underline, Quote, Code, Link as LinkIcon, Image as ImageIcon, 
  List, ListOrdered, Heading1, Heading2, Heading3, 
  AlignLeft, AlignCenter, AlignRight, Save, Eye, Undo, Redo, 
  Strikethrough, ChevronDown, Minus, Maximize, FileCode, Table
} from "lucide-react";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TableGenerator } from "@/components/markdown/TableGenerator";
import { ImageInserter } from "@/components/markdown/ImageInserter";
import { LinkInserter } from "@/components/markdown/LinkInserter";
import { CodeInserter } from "@/components/markdown/CodeInserter";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(5, "标题至少 5 个字符").max(100, "标题最长 100 个字符"),
  content: z.string().min(10, "内容至少 10 个字符"),
  boardId: z.string().min(1, "请选择一个板块"),
});

type FormData = z.infer<typeof schema>;

interface Category {
  id: string;
  name: string;
  boards: { id: string; name: string }[];
}

export default function CreatePostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'table' | 'image' | 'link' | 'code' | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch,
    control
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const content = watch("content"); // Watch content for preview

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // 获取板块数据
    api.get("/sidebar").then((res) => {
      setCategories(res.data.data);
    });
  }, [router]);

  const insertText = (prefix: string, suffix: string = "") => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    
    const newText = before + prefix + selection + suffix + after;
    
    setValue("content", newText, { shouldValidate: true });
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const openDialog = (type: 'table' | 'image' | 'link' | 'code') => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleDialogInsert = (text: string) => {
    insertText(text);
    // Dialog closing is handled by the component's onClose or onInsert callback if needed, 
    // but usually onInsert just updates text.
    // The child components call onClose which we pass as () => setDialogOpen(false)
  };

  const onSubmit = async (data: FormData) => {
    // ... existing onSubmit logic ...
    setIsLoading(true);
    try {
      const res = await api.post("/posts", data);
      router.push(`/posts/${res.data.data.id}`);
    } catch (error: any) {
      console.error("Failed to create post", error);
      if (error.response && error.response.status === 401) {
        toast.error("登录已过期，请重新登录");
        router.push("/auth/login");
      } else {
        toast.error(error.response?.data?.message || "发布失败，请重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const ToolbarButton = ({ 
    icon: Icon, 
    title, 
    onClick,
    className = "",
    active = false
  }: { 
    icon: any, 
    title: string, 
    onClick?: () => void,
    className?: string,
    active?: boolean
  }) => (
    <Button 
      type="button" 
      variant={active ? "secondary" : "ghost"} 
      size="sm" 
      className={`h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted ${active ? 'bg-muted text-foreground' : ''} ${className}`} 
      title={title}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const Divider = () => <div className="w-px h-5 bg-border mx-1" />;

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-2xl font-bold mb-6">发布新帖子</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="w-64">
            <Controller
              control={control}
              name="boardId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择发布板块..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectGroup key={cat.id}>
                        <SelectLabel>{cat.name}</SelectLabel>
                        {cat.boards.map((board) => (
                          <SelectItem key={board.id} value={board.id}>
                            {board.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          
          <Input 
            {...register("title")} 
            placeholder="请输入标题" 
            className="flex-1 text-lg font-medium" 
          />
        </div>
        {(errors.title || errors.boardId) && (
          <div className="flex gap-4 text-red-500 text-sm px-1">
            <span>{errors.boardId?.message}</span>
            <span>{errors.title?.message}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col border rounded-md overflow-hidden bg-card shadow-sm">
          {/* 常用功能栏 */}
          <div className="flex flex-wrap items-center gap-0.5 p-2 bg-muted/30 border-b">
            {/* 组1: 保存/预览 */}
            <ToolbarButton icon={Save} title="保存草稿" onClick={() => alert("暂未实现保存草稿")} />
            <ToolbarButton 
              icon={Eye} 
              title={isPreviewMode ? "编辑模式" : "预览模式"} 
              onClick={() => setIsPreviewMode(!isPreviewMode)} 
              active={isPreviewMode}
            />
            <Divider />
            
            {/* 组2: 撤销/重做 */}
            <ToolbarButton icon={Undo} title="撤销" />
            <ToolbarButton icon={Redo} title="重做" />
            <Divider />

            {/* 组3: 文本格式 */}
            <ToolbarButton icon={Bold} title="加粗" onClick={() => insertText("**", "**")} />
            <ToolbarButton icon={Italic} title="斜体" onClick={() => insertText("*", "*")} />
            <ToolbarButton icon={Strikethrough} title="删除线" onClick={() => insertText("~~", "~~")} />
            <ToolbarButton icon={Quote} title="引用" onClick={() => insertText("\n> ")} />
            <Divider />

            {/* 组4: 标题 */}
            <ToolbarButton icon={Heading1} title="标题 1" onClick={() => insertText("\n# ")} />
            <ToolbarButton icon={Heading2} title="标题 2" onClick={() => insertText("\n## ")} />
            <ToolbarButton icon={Heading3} title="标题 3" onClick={() => insertText("\n### ")} />
            <Divider />

            {/* 组5: 列表 */}
            <ToolbarButton icon={List} title="无序列表" onClick={() => insertText("\n- ")} />
            <ToolbarButton icon={ListOrdered} title="有序列表" onClick={() => insertText("\n1. ")} />
            <ToolbarButton icon={Minus} title="分割线" onClick={() => insertText("\n---\n")} />
            <Divider />

            {/* 组6: 插入 */}
            <ToolbarButton icon={LinkIcon} title="链接" onClick={() => openDialog('link')} />
            <ToolbarButton icon={ImageIcon} title="图片" onClick={() => openDialog('image')} />
            <ToolbarButton icon={Code} title="代码块" onClick={() => openDialog('code')} />
            <ToolbarButton icon={Table} title="表格" onClick={() => openDialog('table')} />
            
            <div className="flex-1" /> {/* 弹簧 */}
            
            <ToolbarButton icon={Maximize} title="全屏" onClick={() => alert("F11 进入全屏")} />
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Textarea Section - Always visible, width adjusts based on preview */}
            <div className={cn("flex flex-col h-full", isPreviewMode ? "w-1/2 border-r" : "w-full")}>
               <textarea
                {...register("content")}
                className="flex-1 w-full p-4 resize-none focus:outline-none bg-transparent font-mono text-sm leading-relaxed"
                placeholder="在此输入正文内容... 支持 Markdown 语法"
                spellCheck={false}
              />
            </div>

            {/* Preview Section - Visible only when preview mode is on */}
            {isPreviewMode && (
              <div className="w-1/2 h-full overflow-y-auto bg-background p-6">
                 <div className="prose dark:prose-invert max-w-none">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-muted-foreground italic">预览区域为空，请先输入内容...</div>
                  )}
                 </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Dialogs */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            {dialogType === 'table' && <TableGenerator onInsert={handleDialogInsert} onClose={() => setDialogOpen(false)} />}
            {dialogType === 'image' && <ImageInserter onInsert={handleDialogInsert} onClose={() => setDialogOpen(false)} />}
            {dialogType === 'link' && <LinkInserter onInsert={handleDialogInsert} onClose={() => setDialogOpen(false)} />}
            {dialogType === 'code' && <CodeInserter onInsert={handleDialogInsert} onClose={() => setDialogOpen(false)} />}
          </DialogContent>
        </Dialog>

        {errors.content && (
          <p className="text-red-500 text-sm">{errors.content.message}</p>
        )}

        <div className="flex justify-end gap-4 py-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-[100px]">
            {isLoading ? "发布中..." : "发布"}
          </Button>
        </div>
      </form>
    </div>
  );
}
