"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MarkdownToolbar } from "@/components/markdown/MarkdownToolbar";
import { UserBadge } from "@/components/UserBadge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
    role: string;
  };
  replies: Comment[];
  location?: string | null;
  replyToUser?: {
    id: string;
    username: string;
  } | null;
}

function CommentInput({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder, 
  buttonText = "发表评论", 
  onCancel,
  isLoading 
}: any) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsert = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    
    const newText = before + prefix + selection + suffix + after;
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="border rounded-md overflow-hidden bg-background focus-within:ring-1 focus-within:ring-ring transition-all shadow-sm">
      <MarkdownToolbar onInsert={handleInsert} />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 min-h-[100px] resize-y bg-transparent border-none focus:outline-none text-sm font-mono leading-relaxed"
        placeholder={placeholder}
      />
      <div className="flex justify-end p-2 bg-muted/20 border-t gap-2">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button size="sm" onClick={onSubmit} disabled={isLoading || !value.trim()}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
}

export default function CommentSection({ postId }: { postId: string }) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyToUser, setReplyToUser] = useState<{id: string, username: string} | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchComments = async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data.data);
    } catch (error) {
      console.error("Failed to fetch comments", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      await api.post(`/posts/${postId}/comments`, { content: newComment });
      setNewComment("");
      fetchComments(); // 刷新列表
    } catch (error: any) {
      console.error("Failed to post comment", error);
      if (error.response?.status === 401) {
        toast.error("请先登录");
        router.push("/auth/login");
      } else {
        toast.error("评论失败，请重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsLoading(true);
    try {
      await api.post(`/posts/${postId}/comments`, { 
        content: replyContent,
        parentId,
        replyToUserId: replyToUser?.id 
      });
      setReplyContent("");
      setReplyingTo(null);
      setReplyToUser(null);
      fetchComments();
      toast.success("回复成功");
    } catch (error: any) {
      console.error("Failed to post reply", error);
      if (error.response?.status === 401) {
        toast.error("请先登录");
        router.push("/auth/login");
      } else {
        toast.error("回复失败，请重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const initiateReply = (commentId: string, user?: {id: string, username: string}) => {
    setReplyingTo(commentId);
    setReplyToUser(user || null);
    // Remove auto-inserted @username since we display it in UI now, or keep it as optional?
    // User requested "replying to whom" UI, so maybe we don't need it in text anymore if we have metadata.
    // But keeping it in text is safer for older clients.
    // However, if we have explicit UI, we can clear the text prefix.
    setReplyContent(""); 
  };

  return (
    <div className="mt-8">
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          评论 <span className="text-sm font-normal text-gray-500">({comments.length})</span>
        </h3>
        <CommentInput 
           value={newComment}
           onChange={setNewComment}
           onSubmit={() => handleSubmit()}
           placeholder="写下你的评论... (支持 Markdown 语法)"
           isLoading={isLoading}
         />
      </div>

      <Card className="overflow-hidden border-t-4 border-t-primary/10">
        <CardContent className="p-0">
          {comments.map((comment, index) => (
            <div key={comment.id} className={cn("p-6 hover:bg-muted/5 transition-colors", index !== comments.length - 1 && "border-b")}>
              <div className="flex gap-4 items-start">
                {/* Avatar Column */}
                <div className="flex-shrink-0 pt-1">
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border shadow-sm">
                    {comment.author.avatar ? (
                      <img src={`http://localhost:3000${comment.author.avatar}`} alt={comment.author.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Column */}
                <div className="flex-grow min-w-0">
                  {/* Header */}
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="font-bold text-gray-900">{comment.author.username || "Unknown"}</span>
                    <UserBadge role={comment.author.role} />
                    <span className="text-xs text-gray-400 ml-auto font-mono">
                      {comment.location && <span className="mr-2 text-gray-500">{comment.location}</span>}
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="prose prose-sm max-w-none text-gray-800 mb-3 dark:prose-invert break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
                  </div>

                  {/* Actions */}
                  <div className="mb-2">
                    <button 
                      className="text-xs text-gray-500 hover:text-primary transition-colors flex items-center gap-1 font-medium px-2 py-1 hover:bg-gray-100 rounded-md -ml-2"
                      onClick={() => initiateReply(comment.id, { id: comment.author.id, username: comment.author.username })}
                    >
                      Reply / 回复
                    </button>
                  </div>

                  {/* Reply Input Area */}
                  {replyingTo === comment.id && (
                    <div className="my-4 animate-in fade-in slide-in-from-top-2 duration-200 pl-4 border-l-2 border-primary/20">
                      <div className="mb-2 text-xs text-gray-500 flex items-center gap-1">
                        <span>回复</span>
                        <span className="font-bold text-primary">@{replyToUser?.username || comment.author.username}</span>
                      </div>
                      <CommentInput
                        value={replyContent}
                        onChange={setReplyContent}
                        onSubmit={() => handleReplySubmit(comment.id)}
                        placeholder="写下你的回复..."
                        buttonText="发送回复"
                        onCancel={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                          setReplyToUser(null);
                        }}
                        isLoading={isLoading}
                      />
                    </div>
                  )}

                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3 pl-2 md:pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="relative group bg-gray-50/50 dark:bg-muted/10 rounded-xl p-4 transition-all hover:bg-gray-100/80 dark:hover:bg-muted/20">
                          
                          <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0 pt-0.5">
                              <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border shadow-sm ring-2 ring-white dark:ring-gray-800">
                                {reply.author.avatar ? (
                                  <img src={`http://localhost:3000${reply.author.avatar}`} alt={reply.author.username} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center flex-wrap gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-900">{reply.author.username}</span>
                                <UserBadge role={reply.author.role} />
                                
                                {reply.replyToUser && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border shadow-sm">
                                    <span className="opacity-60">回复</span>
                                    <span className="font-medium text-primary">@{reply.replyToUser.username}</span>
                                  </span>
                                )}

                                <span className="text-xs text-gray-400 ml-auto font-mono">
                                  {reply.location && <span className="mr-2 text-gray-500">{reply.location}</span>}
                                  {new Date(reply.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="prose prose-sm max-w-none text-gray-700 dark:prose-invert break-words">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.content}</ReactMarkdown>
                              </div>
                              <div className="mt-2 flex items-center gap-4">
                                <button 
                                  className="text-xs text-gray-500 hover:text-primary transition-colors font-medium"
                                  onClick={() => initiateReply(comment.id, { id: reply.author.id, username: reply.author.username })}
                                >
                                  回复
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="p-16 text-center text-gray-500 bg-gray-50/50">
              <div className="mb-3 text-5xl opacity-20">💬</div>
              <p className="text-lg font-medium text-gray-400">暂无评论</p>
              <p className="text-sm">快来发表你的观点吧！</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
