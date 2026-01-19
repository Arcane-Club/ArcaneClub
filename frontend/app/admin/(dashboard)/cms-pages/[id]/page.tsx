"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { PageEditor } from "@/components/admin/PageEditor";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function EditPage() {
  const params = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await axios.get(`/admin/cms-pages/${params.id}`);
        setPage(response.data.data);
      } catch (error) {
        toast.error("Failed to fetch page details");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPage();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!page) {
    return <div>Page not found</div>;
  }

  return <PageEditor initialData={page} isEditing={true} />;
}
