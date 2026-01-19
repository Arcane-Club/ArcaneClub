"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Layers } from "lucide-react";

interface Board {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  boards: Board[];
}

export function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const searchParams = useSearchParams();
  const currentBoardId = searchParams.get("boardId");

  useEffect(() => {
    api.get("/sidebar")
      .then((res) => {
        setCategories(res.data.data);
      })
      .catch((err) => console.error("Failed to fetch categories", err));
  }, []);

  return (
    <div className="w-64 shrink-0 hidden md:block bg-white rounded-xl shadow-sm h-fit p-4 space-y-6 sticky top-24">
      <div>
        <h3 className="font-semibold mb-3 text-xs text-gray-500 uppercase tracking-wider px-2">
          发现
        </h3>
        <div className="space-y-1">
          <Link
            href="/"
            className={cn(
              "block px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
              !currentBoardId
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <Layers className="h-4 w-4" />
            全部帖子
          </Link>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category.id}>
          <h3 className="font-semibold mb-3 text-xs text-gray-500 uppercase tracking-wider px-2">
            {category.name}
          </h3>
          <div className="space-y-1">
            {category.boards.map((board) => (
              <Link
                key={board.id}
                href={`/?boardId=${board.id}`}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm transition-colors",
                  currentBoardId === board.id
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                # {board.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
