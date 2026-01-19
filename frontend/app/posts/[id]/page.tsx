"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import PostInteractions from "@/components/PostInteractions";
import CommentSection from "@/components/CommentSection";

interface Post {
  id: string;
  title: string;
  content: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  author: {
    username: string;
  };
  board: {
    name: string;
  };
  isLiked: boolean;
  isFavorited: boolean;
  commentCount: number;
}

export default function PostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/posts/${id}`)
        .then((res) => {
          setPost(res.data.data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="p-8 text-center">加载中...</div>;
  if (!post) return <div className="p-8 text-center">帖子未找到</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {post.board.name}
            </span>
            <span className="text-gray-500 text-sm">
              {new Date(post.createdAt).toLocaleString()}
            </span>
          </div>
          <CardTitle className="text-2xl">{post.title}</CardTitle>
          <div className="text-sm text-gray-600 mt-2">
            作者: {post.author.username || "匿名"} | 阅读: {post.viewCount}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none whitespace-pre-wrap">
            {post.content}
          </div>
          
          <PostInteractions 
            postId={post.id} 
            initialLiked={post.isLiked} 
            initialFavorited={post.isFavorited}
            likeCount={post.likeCount}
            commentCount={post.commentCount}
          />
        </CardContent>
      </Card>

      <div id="comments">
        <CommentSection postId={post.id} />
      </div>
    </div>
  );
}
