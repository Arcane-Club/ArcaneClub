import axios from "@/lib/axios";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPage(slug: string) {
  try {
    // Note: This is a server component, but axios usually needs full URL on server or configured base URL.
    // However, @/lib/axios might be configured for client side (browser).
    // For server-side fetching in Next.js, fetch is often better, or use absolute URL.
    // Assuming backend is at http://localhost:3000/api (or 3000 if same host).
    // Since we are inside Docker or local, let's try to use the public API url if possible.
    // But axios instance in lib/axios typically has base URL.
    // If it fails, we might need to fetch directly.
    
    // For simplicity in this environment, I'll assume axios works if baseUrl is set to localhost:3000/api
    // But @/lib/axios might rely on browser cookies etc.
    // Let's use standard fetch for server component to be safe, or just client component.
    // User didn't specify SEO requirements, but server component is better for pages.
    
    const res = await fetch(`http://localhost:3000/api/misc/pages/${slug}`, {
      cache: 'no-store' 
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

export default async function PublicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm p-8 min-h-[50vh]">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 border-b pb-4">{page.title}</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {page.content}
          </ReactMarkdown>
        </div>
        <div className="mt-12 text-sm text-gray-500 border-t pt-4">
            Last updated: {new Date(page.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
