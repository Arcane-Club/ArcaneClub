"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Star, MessageSquare, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  postId: string;
  initialLiked: boolean;
  initialFavorited: boolean;
  likeCount: number;
  commentCount: number;
}

export default function PostInteractions({ 
  postId, 
  initialLiked, 
  initialFavorited, 
  likeCount: initialLikeCount,
  commentCount
}: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Optimistic update
      const previousLiked = liked;
      const previousCount = likeCount;
      
      setLiked(!previousLiked);
      setLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);

      const res = await api.post(`/posts/${postId}/like`);
      const newLiked = res.data.data.liked;
      
      // Verify with server state
      if (newLiked !== !previousLiked) {
         setLiked(newLiked);
         setLikeCount(newLiked ? previousCount + 1 : previousCount - 1);
      }
    } catch (error) {
      console.error("Failed to toggle like", error);
      toast.error("操作失败");
      // Revert on error
      setLiked(liked);
      setLikeCount(likeCount);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavorite = async () => {
    try {
      const res = await api.post(`/posts/${postId}/favorite`);
      setFavorited(res.data.data.favorited);
      toast.success(res.data.data.favorited ? "已收藏" : "已取消收藏");
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      toast.error("操作失败");
    }
  };

  const scrollToComments = () => {
    document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("链接已复制到剪贴板");
  };

  return (
    <div className="flex items-center justify-between py-6 mt-8 border-t border-b border-gray-100 dark:border-gray-800">
      <div className="flex gap-4">
        <Button
          variant="ghost"
          size="lg"
          className={cn(
            "rounded-full gap-2 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20",
            liked ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-gray-500 hover:text-blue-600"
          )}
          onClick={handleLike}
        >
          <div className={cn("transition-transform duration-300", liked && "scale-110")}>
            <ThumbsUp className={cn("w-5 h-5", liked && "fill-current")} />
          </div>
          <span className="font-medium">{likeCount > 0 ? likeCount : "点赞"}</span>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className={cn(
            "rounded-full gap-2 transition-all duration-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20",
            favorited ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" : "text-gray-500 hover:text-yellow-600"
          )}
          onClick={handleFavorite}
        >
          <div className={cn("transition-transform duration-300", favorited && "scale-110")}>
            <Star className={cn("w-5 h-5", favorited && "fill-current")} />
          </div>
          <span className="font-medium">{favorited ? "已收藏" : "收藏"}</span>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="rounded-full gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          onClick={scrollToComments}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">{commentCount > 0 ? commentCount : "评论"}</span>
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={handleShare}
        title="分享"
      >
        <Share2 className="w-5 h-5" />
      </Button>
    </div>
  );
}
