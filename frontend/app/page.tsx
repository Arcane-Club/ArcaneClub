"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import api from "@/lib/axios";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Eye, ThumbsUp, Bookmark } from "lucide-react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    username: string;
    avatar: string | null;
  };
  board: {
    name: string;
  };
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  _count: {
    favorites: number;
  };
}

export default function Home() {
  const searchParams = useSearchParams();
  const boardId = searchParams.get("boardId");
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await api.get("/posts", {
          params: {
            page,
            limit: 10,
            boardId,
          },
        });
        setPosts(res.data.data.posts);
        setTotalPages(res.data.data.pagination.totalPages);
      } catch (error) {
        console.error("Failed to fetch posts", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, boardId]);

  return (
    <div className="container mx-auto flex gap-6 py-6 items-start">
      <Sidebar />
      <div className="flex-1 bg-white rounded-xl shadow-sm p-4 min-h-[500px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {boardId ? "板块帖子" : "最新帖子"}
          </h1>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">加载中...</div>
        ) : posts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">暂无帖子</div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2 text-xs text-gray-500">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {post.board.name}
                        </span>
                        <span>•</span>
                        <span>{post.author.username || "匿名用户"}</span>
                        <span>•</span>
                        <span>{format(new Date(post.createdAt), "yyyy-MM-dd HH:mm")}</span>
                      </div>
                      <Link href={`/posts/${post.id}`}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600">
                          {post.title}
                        </h2>
                      </Link>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-1" title="阅读">
                      <Eye className="h-4 w-4" />
                      <span>{post.viewCount}</span>
                    </div>
                    <div className="flex items-center space-x-1" title="点赞">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{post.likeCount}</span>
                    </div>
                    <div className="flex items-center space-x-1" title="评论">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.commentCount}</span>
                    </div>
                    <div className="flex items-center space-x-1" title="收藏">
                      <Bookmark className="h-4 w-4" />
                      <span>{post._count?.favorites || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              上一页
            </Button>
            <span className="flex items-center px-4 text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
