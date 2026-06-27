"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/topbar";
import { userAPI } from "@/lib/api";

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  comments: number;
  likes: number;
}

type TabType = "posts" | "comments";

export default function UserPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const userIdRaw = localStorage.getItem("userId");

    if (!token || !userIdRaw) {
      router.push("/login");
      return;
    }

    const userId = Number(userIdRaw);
    if (Number.isNaN(userId)) {
      router.push("/login");
      return;
    }

    // TODO: API 연결 후 사용자의 게시글과 댓글 가져오기
    setIsLoading(false);
  }, [router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const PostItem = ({ item }: { item: Post }) => (
    <div className="flex gap-4 rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50 transition cursor-pointer">
      {/* Avatar */}
      <div
        className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-slate-300 to-slate-400"
        aria-label="사용자 아바타"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900">
            {item.author}
          </span>
          <span className="text-xs text-neutral-500">
            {formatDate(item.createdAt)}
          </span>
        </div>
        <h3 className="mb-2 text-sm font-medium text-neutral-900 line-clamp-2">
          {item.title}
        </h3>
        <p className="text-xs text-neutral-600 line-clamp-1">
          {item.content}
        </p>
      </div>

      {/* Meta */}
      <div className="flex shrink-0 gap-4 text-xs text-neutral-500">
        <div className="flex items-center gap-1">
          <span>💬</span>
          <span>{item.comments}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>❤️</span>
          <span>{item.likes}</span>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="mb-6 text-center text-neutral-600">
        아직 작성한 글이 없습니다.
      </p>
      <button
        onClick={() => router.push("/")}
        className="rounded-xl bg-main100 px-6 py-3 text-white font-semibold transition hover:brightness-105"
      >
        커뮤니티 가기
      </button>
    </div>
  );

  return (
    <div className="relative isolate flex min-h-screen w-full flex-col bg-white">
      <Topbar />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
          {/* Header */}
          <div className="mb-10">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition"
            >
              <span>←</span>
              <span>뒤로가기</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                내가 쓴 글 / 댓글
              </h1>
              <p className="text-sm text-neutral-600">
                커뮤니티에서 남긴 흔적과 질문을 모아봤어요
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8 border-b border-neutral-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("posts")}
                className={`pb-4 text-sm font-medium transition ${
                  activeTab === "posts"
                    ? "border-b-2 border-main100 text-main100"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                내가 쓴 글({posts.length})
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`pb-4 text-sm font-medium transition ${
                  activeTab === "comments"
                    ? "border-b-2 border-main100 text-main100"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                댓글 단 글({comments.length})
              </button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-neutral-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : activeTab === "posts" ? (
            posts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {posts.map((item) => (
                  <PostItem key={item.id} item={item} />
                ))}
              </div>
            )
          ) : (
            comments.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {comments.map((item) => (
                  <PostItem key={item.id} item={item} />
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
