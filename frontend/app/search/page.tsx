"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import api from "@/lib/axios";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!query) return;
      
      try {
        setLoading(true);
        const res = await api.get("/posts", {
          params: {
            page,
            limit: 10,
            search: query,
          },
        });
        setPosts(res.data.data.posts);
        setTotalPages(res.data.data.pagination.totalPages);
      } catch (error) {
        console.error("Failed to fetch search results", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, query]);

  if (!query) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm p-8 min-h-[500px] flex flex-col items-center justify-center text-gray-500">
        <p className="text-lg">请输入搜索关键词</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm p-4 min-h-[500px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          搜索结果: <span className="text-blue-600">"{query}"</span>
        </h1>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">搜索中...</div>
      ) : posts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">未找到相关帖子</div>
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
                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.viewCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button 
                variant="outline" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
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
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="container mx-auto flex gap-6 py-6">
      <Sidebar />
      <Suspense fallback={<div className="flex-1 bg-white rounded-xl shadow-sm p-4 min-h-[500px] flex items-center justify-center">加载中...</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
