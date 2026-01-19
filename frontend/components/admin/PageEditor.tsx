"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, ArrowLeft, Save, 
  Type, Heading1, Heading2, Heading3, Quote, 
  Code, Link as LinkIcon, 
  List, ListOrdered, 
  Image as ImageIcon, Minus,
  Info, AlertTriangle, CheckCircle, XCircle,
  GripVertical, Trash2, ArrowUp, ArrowDown, Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

// --- Types ---
type BlockType = 
  | "paragraph" 
  | "heading1" | "heading2" | "heading3" 
  | "quote" 
  | "list-ul" | "list-ol" 
  | "image" 
  | "divider" 
  | "code" 
  | "callout-info" | "callout-warning" | "callout-success" | "callout-error";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: any;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  published: z.boolean(),
});

interface PageEditorProps {
  initialData?: any;
  isEditing?: boolean;
}

// --- Module Definitions ---
const modules = [
  { category: "基础", items: [
    { type: "paragraph", label: "段落", icon: Type },
    { type: "heading1", label: "标题 1", icon: Heading1 },
    { type: "heading2", label: "标题 2", icon: Heading2 },
    { type: "heading3", label: "标题 3", icon: Heading3 },
    { type: "quote", label: "引用", icon: Quote },
  ]},
  { category: "列表", items: [
    { type: "list-ul", label: "无序列表", icon: List },
    { type: "list-ol", label: "有序列表", icon: ListOrdered },
  ]},
  { category: "媒体与结构", items: [
    { type: "image", label: "图片", icon: ImageIcon },
    { type: "code", label: "代码块", icon: Code },
    { type: "divider", label: "分割线", icon: Minus },
  ]},
  { category: "组件", items: [
    { type: "callout-info", label: "提示信息", icon: Info },
    { type: "callout-warning", label: "警告信息", icon: AlertTriangle },
    { type: "callout-success", label: "成功信息", icon: CheckCircle },
    { type: "callout-error", label: "错误信息", icon: XCircle },
  ]},
];

// --- Helpers ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const parseMarkdown = (md: string): Block[] => {
  if (!md) return [];
  const lines = md.split("\n");
  const blocks: Block[] = [];
  let currentBlock: Block | null = null;

  // Simplistic parser
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Callouts
    if (line.startsWith("> ℹ️ **提示**")) { blocks.push({ id: generateId(), type: "callout-info", content: "" }); continue; }
    if (line.startsWith("> ⚠️ **警告**")) { blocks.push({ id: generateId(), type: "callout-warning", content: "" }); continue; }
    if (line.startsWith("> ✅ **成功**")) { blocks.push({ id: generateId(), type: "callout-success", content: "" }); continue; }
    if (line.startsWith("> ❌ **错误**")) { blocks.push({ id: generateId(), type: "callout-error", content: "" }); continue; }
    if (currentBlock && currentBlock.type.startsWith("callout-")) {
        if (line.trim() === ">" || line.trim() === "") continue;
        if (line.startsWith("> ")) {
            currentBlock.content += (currentBlock.content ? "\n" : "") + line.substring(2);
            continue;
        }
        currentBlock = null; // End of callout
    }

    if (line.startsWith("# ")) { blocks.push({ id: generateId(), type: "heading1", content: line.substring(2) }); continue; }
    if (line.startsWith("## ")) { blocks.push({ id: generateId(), type: "heading2", content: line.substring(3) }); continue; }
    if (line.startsWith("### ")) { blocks.push({ id: generateId(), type: "heading3", content: line.substring(4) }); continue; }
    if (line.startsWith("> ")) { blocks.push({ id: generateId(), type: "quote", content: line.substring(2) }); continue; }
    if (line.startsWith("- ")) { blocks.push({ id: generateId(), type: "list-ul", content: line.substring(2) }); continue; }
    if (/^\d+\.\s/.test(line)) { blocks.push({ id: generateId(), type: "list-ol", content: line.replace(/^\d+\.\s/, "") }); continue; }
    if (line.startsWith("---")) { blocks.push({ id: generateId(), type: "divider", content: "" }); continue; }
    if (line.startsWith("```")) { 
        // Code block handling could be better, treating as separate block for now
        let codeContent = "";
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith("```")) {
            codeContent += lines[j] + "\n";
            j++;
        }
        blocks.push({ id: generateId(), type: "code", content: codeContent.trim() });
        i = j;
        continue;
    }
    const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
        blocks.push({ id: generateId(), type: "image", content: imgMatch[2], metadata: { alt: imgMatch[1] } });
        continue;
    }
    
    if (line.trim() !== "") {
        blocks.push({ id: generateId(), type: "paragraph", content: line });
    }
  }
  return blocks;
};

const serializeMarkdown = (blocks: Block[]): string => {
  return blocks.map(block => {
    switch (block.type) {
      case "heading1": return `# ${block.content}`;
      case "heading2": return `## ${block.content}`;
      case "heading3": return `### ${block.content}`;
      case "quote": return `> ${block.content}`;
      case "list-ul": return `- ${block.content}`;
      case "list-ol": return `1. ${block.content}`;
      case "divider": return `---`;
      case "image": return `![${block.metadata?.alt || "image"}](${block.content})`;
      case "code": return `\`\`\`\n${block.content}\n\`\`\``;
      case "callout-info": return `> ℹ️ **提示**\n> \n> ${block.content.replace(/\n/g, "\n> ")}`;
      case "callout-warning": return `> ⚠️ **警告**\n> \n> ${block.content.replace(/\n/g, "\n> ")}`;
      case "callout-success": return `> ✅ **成功**\n> \n> ${block.content.replace(/\n/g, "\n> ")}`;
      case "callout-error": return `> ❌ **错误**\n> \n> ${block.content.replace(/\n/g, "\n> ")}`;
      default: return block.content;
    }
  }).join("\n\n");
};

export function PageEditor({ initialData, isEditing = false }: PageEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [draggingType, setDraggingType] = useState<BlockType | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      published: initialData?.published || false,
    },
  });

  useEffect(() => {
    if (initialData?.content) {
        setBlocks(parseMarkdown(initialData.content));
    } else if (!isEditing) {
        // Default blocks for new page
        setBlocks([
            { id: generateId(), type: "heading1", content: "Welcome to your new page" },
            { id: generateId(), type: "paragraph", content: "Start editing by dragging modules from the right sidebar." }
        ]);
    }
  }, [initialData, isEditing]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSaving(true);
    const markdown = serializeMarkdown(blocks);
    const payload = { ...values, content: markdown };
    
    try {
      if (isEditing && initialData?.id) {
        await axios.put(`/admin/cms-pages/${initialData.id}`, payload);
        toast.success("Page updated successfully");
      } else {
        await axios.post("/admin/cms-pages", payload);
        toast.success("Page created successfully");
      }
      router.push("/admin/cms-pages");
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  // --- Block Management ---
  const addBlock = (type: BlockType, index?: number) => {
    const newBlock: Block = { id: generateId(), type, content: "" };
    setBlocks(prev => {
        const next = [...prev];
        if (index !== undefined) {
            next.splice(index, 0, newBlock);
        } else {
            next.push(newBlock);
        }
        return next;
    });
  };

  const updateBlock = (id: string, content: string, metadata?: any) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content, metadata: { ...b.metadata, ...metadata } } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks(prev => {
        const index = prev.findIndex(b => b.id === id);
        if (index === -1) return prev;
        if (direction === "up" && index === 0) return prev;
        if (direction === "down" && index === prev.length - 1) return prev;
        
        const next = [...prev];
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
        return next;
    });
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, type: BlockType) => {
    setDraggingType(type);
    e.dataTransfer.setData("type", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingType(null);
    const type = e.dataTransfer.getData("type") as BlockType;
    if (type) {
        addBlock(type);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Auto-generate slug
  const title = form.watch("title");
  useEffect(() => {
    if (!isEditing && title) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const currentSlug = form.getValues("slug");
      if (!currentSlug || !form.getFieldState("slug").isDirty) {
         form.setValue("slug", slug);
      }
    }
  }, [title, isEditing, form]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{isEditing ? "编辑页面" : "新建页面"}</h1>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={form.handleSubmit(onSubmit)} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> 保存页面
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Editor Canvas */}
        <div className="lg:col-span-3 space-y-6">
            {/* Page Metadata Form */}
            <Card>
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>页面标题</FormLabel>
                                <FormControl>
                                    <Input placeholder="输入页面标题..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Slug (URL)</FormLabel>
                                <FormControl>
                                    <Input placeholder="page-url-slug" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                             <FormField
                                control={form.control}
                                name="published"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 col-span-2">
                                    <div className="space-y-0.5">
                                    <FormLabel className="text-base">立即发布</FormLabel>
                                    <FormDescription>
                                        启用后页面将对外可见
                                    </FormDescription>
                                    </div>
                                    <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Blocks Canvas */}
            <div 
                className={cn(
                    "min-h-[500px] border-2 border-dashed rounded-xl p-8 space-y-4 transition-colors",
                    draggingType ? "border-blue-400 bg-blue-50/50" : "border-gray-200 bg-white"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {blocks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                        <p>拖拽右侧模块到此处开始编辑</p>
                    </div>
                )}
                
                {blocks.map((block, index) => (
                    <div key={block.id} className="group relative flex gap-2 items-start">
                        {/* Block Controls */}
                        <div className="absolute -left-12 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex flex-col bg-white border shadow-sm rounded-md overflow-hidden">
                                <button onClick={() => moveBlock(block.id, "up")} className="p-1.5 hover:bg-gray-100 text-gray-500"><ArrowUp className="h-3 w-3" /></button>
                                <button onClick={() => moveBlock(block.id, "down")} className="p-1.5 hover:bg-gray-100 text-gray-500"><ArrowDown className="h-3 w-3" /></button>
                            </div>
                            <button onClick={() => removeBlock(block.id)} className="p-1.5 bg-white border shadow-sm rounded-md hover:bg-red-50 text-red-500"><Trash2 className="h-3 w-3" /></button>
                        </div>

                        {/* Block Content */}
                        <div className="flex-1 bg-white border border-transparent hover:border-blue-200 rounded-lg p-3 transition-colors ring-offset-2 focus-within:ring-2 ring-blue-500/20">
                            {/* Render Block based on type */}
                            {block.type === "paragraph" && (
                                <Textarea 
                                    value={block.content} 
                                    onChange={(e) => updateBlock(block.id, e.target.value)}
                                    placeholder="输入段落文本..."
                                    className="min-h-[80px] border-none shadow-none resize-none focus-visible:ring-0 p-0 text-base"
                                />
                            )}
                            {block.type.startsWith("heading") && (
                                <Input 
                                    value={block.content} 
                                    onChange={(e) => updateBlock(block.id, e.target.value)}
                                    placeholder={`Heading ${block.type.replace("heading", "")}`}
                                    className={cn(
                                        "border-none shadow-none focus-visible:ring-0 p-0 font-bold",
                                        block.type === "heading1" ? "text-3xl" : 
                                        block.type === "heading2" ? "text-2xl" : "text-xl"
                                    )}
                                />
                            )}
                            {block.type === "quote" && (
                                <div className="flex gap-4">
                                    <div className="w-1 bg-gray-300 rounded-full shrink-0" />
                                    <Textarea 
                                        value={block.content} 
                                        onChange={(e) => updateBlock(block.id, e.target.value)}
                                        placeholder="引用文本..."
                                        className="min-h-[60px] border-none shadow-none resize-none focus-visible:ring-0 p-0 text-gray-600 italic"
                                    />
                                </div>
                            )}
                            {(block.type === "list-ul" || block.type === "list-ol") && (
                                <div className="flex gap-2 items-start">
                                    <span className="mt-2 text-gray-400 font-mono select-none">
                                        {block.type === "list-ul" ? "•" : "1."}
                                    </span>
                                    <Input 
                                        value={block.content} 
                                        onChange={(e) => updateBlock(block.id, e.target.value)}
                                        placeholder="列表项内容..."
                                        className="border-none shadow-none focus-visible:ring-0 p-0 h-auto py-1"
                                    />
                                </div>
                            )}
                            {block.type === "divider" && (
                                <div className="py-4"><div className="h-px bg-gray-200 w-full" /></div>
                            )}
                            {block.type === "code" && (
                                <div className="bg-gray-900 rounded-md p-4 font-mono text-sm">
                                    <Textarea 
                                        value={block.content} 
                                        onChange={(e) => updateBlock(block.id, e.target.value)}
                                        placeholder="// 输入代码..."
                                        className="min-h-[100px] border-none shadow-none resize-none focus-visible:ring-0 p-0 bg-transparent text-gray-100"
                                    />
                                </div>
                            )}
                            {block.type === "image" && (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Input 
                                            value={block.content} 
                                            onChange={(e) => updateBlock(block.id, e.target.value)}
                                            placeholder="图片 URL (https://...)"
                                            className="flex-1"
                                        />
                                        <Input 
                                            value={block.metadata?.alt || ""} 
                                            onChange={(e) => updateBlock(block.id, block.content, { alt: e.target.value })}
                                            placeholder="Alt 文本"
                                            className="w-1/3"
                                        />
                                    </div>
                                    {block.content && (
                                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                            <img src={block.content} alt={block.metadata?.alt} className="object-cover w-full h-full" />
                                        </div>
                                    )}
                                </div>
                            )}
                            {block.type.startsWith("callout") && (
                                <div className={cn(
                                    "p-4 rounded-lg border flex gap-3",
                                    block.type === "callout-info" && "bg-blue-50 border-blue-100 text-blue-900",
                                    block.type === "callout-warning" && "bg-yellow-50 border-yellow-100 text-yellow-900",
                                    block.type === "callout-success" && "bg-green-50 border-green-100 text-green-900",
                                    block.type === "callout-error" && "bg-red-50 border-red-100 text-red-900",
                                )}>
                                    <div className="shrink-0 mt-1">
                                        {block.type === "callout-info" && "ℹ️"}
                                        {block.type === "callout-warning" && "⚠️"}
                                        {block.type === "callout-success" && "✅"}
                                        {block.type === "callout-error" && "❌"}
                                    </div>
                                    <Textarea 
                                        value={block.content} 
                                        onChange={(e) => updateBlock(block.id, e.target.value)}
                                        placeholder="输入提示内容..."
                                        className="min-h-[60px] border-none shadow-none resize-none focus-visible:ring-0 p-0 bg-transparent text-inherit placeholder:text-inherit/50"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Sidebar Modules */}
        <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase">组件库</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {modules.map((category) => (
                            <div key={category.category}>
                                <h4 className="text-xs font-semibold text-gray-400 mb-2">{category.category}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {category.items.map((item) => (
                                        <div
                                            key={item.type}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item.type as BlockType)}
                                            className="h-20 flex flex-col items-center justify-center gap-2 border rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all cursor-move bg-white shadow-sm"
                                        >
                                            <item.icon className="h-5 w-5" />
                                            <span className="text-xs">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
