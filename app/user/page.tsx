"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, MessageCircle } from "lucide-react";
import Topbar from "@/components/topbar";
import { communityAPI, userAPI } from "@/lib/api";

interface PostAuthor {
  id: number;
  nickname: string;
  jobCategoryName?: string | null;
  experienceLevelLabel?: string | null;
}

interface PostSummary {
  id: number;
  category: "QNA" | "INFO" | "FREE";
  title: string;
  author: PostAuthor;
  imageUrls: string[];
  likeCount: number;
  commentCount: number;
  best: boolean;
  createdAt: string;
}

interface MyComment {
  id: number;
  postId: number;
  postTitle: string;
  postCategory: "QNA" | "INFO" | "FREE";
  parentCommentId: number | null;
  content: string;
  createdAt: string;
}

interface PageResponse {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface PostPageResponse extends PageResponse {
  posts: PostSummary[];
}

interface CommentPageResponse extends PageResponse {
  comments: MyComment[];
}

type TabType = "posts" | "comments";

const PAGE_SIZE = 20;

function stripLevelTier(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/, "");
}

function stripUiUx(label: string): string {
  return label.replace(/\s*UI\/UX\s*$/i, "");
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}

export default function UserPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [postsPage, setPostsPage] = useState(0);
  const [postsData, setPostsData] = useState<PostPageResponse | null>(null);
  const [commentsPage, setCommentsPage] = useState(0);
  const [commentsData, setCommentsData] = useState<CommentPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<{
    nickname: string;
    jobCategoryName: string | null;
    experienceLevelLabel: string | null;
  }>({ nickname: "", jobCategoryName: null, experienceLevelLabel: null });

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

    userAPI
      .getProfile(userId)
      .then((data) => {
        setMyProfile({
          nickname: data?.nickname ?? "",
          jobCategoryName: data?.jobCategoryName ?? null,
          experienceLevelLabel: data?.experienceLevelLabel ?? null,
        });
      })
      .catch(() => {});

    Promise.all([
      communityAPI.getMyPosts(0, PAGE_SIZE),
      communityAPI.getMyComments(0, PAGE_SIZE),
    ])
      .then(([posts, comments]) => {
        setPostsData(posts);
        setCommentsData(comments);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [router]);

  useEffect(() => {
    if (postsPage === 0) return;
    communityAPI.getMyPosts(postsPage, PAGE_SIZE).then(setPostsData);
  }, [postsPage]);

  useEffect(() => {
    if (commentsPage === 0) return;
    communityAPI.getMyComments(commentsPage, PAGE_SIZE).then(setCommentsData);
  }, [commentsPage]);

  const PostRow = ({ post }: { post: PostSummary }) => (
    <div
      onClick={() => router.push(`/community/${post.id}`)}
      className="flex flex-col gap-1.5 rounded-2xl bg-white px-6 pt-[8px] pb-5 shadow-[0_2px_10px_rgba(0,0,0,0.10)] transition hover:shadow-[0_4px_14px_rgba(0,0,0,0.14)] cursor-pointer"
    >
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <span className="h-5 w-5 shrink-0 rounded-full bg-main25" />
          <span className="font-semibold text-gray-700">{post.author.nickname}</span>
          {(post.author.jobCategoryName || post.author.experienceLevelLabel) && (
            <span className="text-xs font-semibold text-main100">
              {[
                post.author.jobCategoryName ? stripUiUx(post.author.jobCategoryName) : null,
                post.author.experienceLevelLabel ? stripLevelTier(post.author.experienceLevelLabel) : null,
              ].filter(Boolean).join(" / ")}
            </span>
          )}
        </span>
        <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <p className="flex-1 truncate text-base font-bold text-gray-900">{post.title}</p>
      </div>

      <div className="flex items-center justify-end gap-3 text-sm text-gray-400">
        <span className="flex items-center gap-1">
          <ThumbsUp size={14} />
          {post.likeCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={14} />
          {post.commentCount}
        </span>
      </div>
    </div>
  );

  const CommentRow = ({ item }: { item: MyComment }) => (
    <div
      onClick={() => router.push(`/community/${item.postId}`)}
      className="flex flex-col gap-1.5 rounded-2xl bg-white px-6 pt-[8px] pb-5 shadow-[0_2px_10px_rgba(0,0,0,0.10)] transition hover:shadow-[0_4px_14px_rgba(0,0,0,0.14)] cursor-pointer"
    >
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <span className="h-5 w-5 shrink-0 rounded-full bg-main25" />
          <span className="font-semibold text-gray-700">{myProfile.nickname}</span>
          {(myProfile.jobCategoryName || myProfile.experienceLevelLabel) && (
            <span className="text-xs font-semibold text-main100">
              {[
                myProfile.jobCategoryName ? stripUiUx(myProfile.jobCategoryName) : null,
                myProfile.experienceLevelLabel ? stripLevelTier(myProfile.experienceLevelLabel) : null,
              ].filter(Boolean).join(" / ")}
            </span>
          )}
        </span>
        <span className="text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
      </div>

      <div className="mt-2">
        <p className="text-xs text-gray-400 truncate">게시글: {item.postTitle}</p>
        <p className="text-base font-bold text-gray-900 line-clamp-2">{item.content}</p>
      </div>
    </div>
  );

  const Pagination = ({
    page,
    totalPages,
    onChange,
  }: {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-30"
        >
          이전
        </button>
        <span className="text-sm text-gray-500">
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-30"
        >
          다음
        </button>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="mb-6 text-center text-neutral-600">
        아직 작성한 글이 없습니다.
      </p>
      <button
        onClick={() => router.push("/community")}
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
        <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
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
                내가 쓴 글({postsData?.totalElements ?? 0})
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`pb-4 text-sm font-medium transition ${
                  activeTab === "comments"
                    ? "border-b-2 border-main100 text-main100"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                댓글 단 글({commentsData?.totalElements ?? 0})
              </button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-neutral-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : activeTab === "posts" ? (
            !postsData || postsData.posts.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {postsData.posts.map((post) => (
                    <PostRow key={post.id} post={post} />
                  ))}
                </div>
                <Pagination
                  page={postsPage}
                  totalPages={postsData.totalPages}
                  onChange={setPostsPage}
                />
              </>
            )
          ) : !commentsData || commentsData.comments.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {commentsData.comments.map((item) => (
                  <CommentRow key={item.id} item={item} />
                ))}
              </div>
              <Pagination
                page={commentsPage}
                totalPages={commentsData.totalPages}
                onChange={setCommentsPage}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
