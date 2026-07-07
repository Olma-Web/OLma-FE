"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Topbar from "@/components/topbar";
import WriteForm from "@/components/community/WriteForm";
import { communityAPI } from "@/lib/api";

type Category = "QNA" | "INFO" | "FREE";

interface PostDetail {
  title: string;
  content: string;
  category: Category;
  author: { id: number };
}

export default function CommunityEditPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    if (!postId || Number.isNaN(postId)) {
      setError("잘못된 게시글이에요.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data: PostDetail = await communityAPI.getPost(postId);
      const currentUserId = Number(localStorage.getItem("userId"));
      if (data.author.id !== currentUserId) {
        router.replace(`/community/${postId}`);
        return;
      }
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글을 불러올 수 없어요.");
    } finally {
      setIsLoading(false);
    }
  }, [postId, router]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <Topbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-6">
        <h1 className="text-2xl font-extrabold text-gray-900">글 수정</h1>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-main25 border-t-main100" />
            </div>
          ) : error || !post ? (
            <p className="py-16 text-center text-sm text-red-500">{error ?? "게시글을 찾을 수 없어요."}</p>
          ) : (
            <WriteForm
              postId={postId}
              initialTitle={post.title}
              initialContent={post.content}
              initialCategory={post.category}
            />
          )}
        </div>
      </main>
    </div>
  );
}
