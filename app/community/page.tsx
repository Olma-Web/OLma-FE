"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageCircle, ThumbsUp, ImageIcon } from "lucide-react";
import Topbar from "@/components/topbar";
import { communityAPI, referenceAPI } from "@/lib/api";

type Category = "QNA" | "INFO" | "FREE";
type PostSort = "LATEST" | "LIKES" | "COMMENTS";

interface JobCategoryOption {
  id: number;
  name: string;
  slug: string;
  children?: JobCategoryOption[] | null;
}

// 커뮤니티는 UI/UX 디자이너 전용이라 전체 직군 트리 중 웹/앱 UI/UX만 필터로 노출
const COMMUNITY_JOB_SLUGS = ["web-uiux", "app-uiux"];

interface ExperienceLevelOption {
  id: number;
  label: string;
}

interface Author {
  id: number;
  nickname: string;
  jobCategoryName: string | null;
  experienceLevelLabel: string | null;
  badgeLabel: string | null;
}

interface PostSummary {
  id: number;
  category: Category;
  title: string;
  contentPreview: string;
  author: Author;
  imageUrls: string[];
  likeCount: number;
  commentCount: number;
  best: boolean;
  createdAt: string;
}

interface PostListResponse {
  bestPosts: PostSummary[];
  posts: PostSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const CATEGORY_BADGE_LABEL: Record<Category, string> = {
  QNA: "Q&A",
  INFO: "정보/꿀팁",
  FREE: "자유/푸념",
};

const CATEGORY_TABS: { label: string; value: Category | null }[] = [
  { label: "전체", value: null },
  { label: "Q&A(실무/세무)", value: "QNA" },
  { label: "정보/꿀팁", value: "INFO" },
  { label: "자유/푸념", value: "FREE" },
];

const SORT_OPTIONS: { label: string; value: PostSort }[] = [
  { label: "최신", value: "LATEST" },
  { label: "좋아요", value: "LIKES" },
  { label: "댓글많은순", value: "COMMENTS" },
];

function flattenJobCategories(categories: JobCategoryOption[]): JobCategoryOption[] {
  return categories.flatMap((category) => {
    const children = category.children?.length ? flattenJobCategories(category.children) : [];
    return children.length ? children : [category];
  });
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

function stripLevelTier(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/, "");
}

function stripUiUx(label: string): string {
  return label.replace(/\s*UI\/UX\s*$/i, "");
}

function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/community/${post.id}`}
      className="flex flex-col rounded-2xl bg-white px-6 pt-5 pb-5 shadow-[0_2px_10px_rgba(0,0,0,0.10)] transition hover:shadow-[0_4px_14px_rgba(0,0,0,0.14)]"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <span className="rounded-lg bg-main25 px-2 py-1.5 text-xs font-semibold text-main100">
            {CATEGORY_BADGE_LABEL[post.category]}
          </span>
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

      <div className="mt-2.5 flex items-center gap-3">
        <p className="flex-1 truncate text-base font-bold text-gray-900">{post.title}</p>
        {post.imageUrls.length > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
            <ImageIcon size={13} />
            {post.imageUrls.length}
          </span>
        )}
      </div>

      {post.contentPreview && (
        <p className="mt-2 line-clamp-1 text-sm font-medium text-gray-500">{post.contentPreview}</p>
      )}

      <div className="mt-2 flex items-center justify-end gap-3 text-sm text-gray-400">
        <span className="flex items-center gap-1">
          <ThumbsUp size={14} />
          {post.likeCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={14} />
          {post.commentCount}
        </span>
      </div>
    </Link>
  );
}

export default function CommunityPage() {
  const [category, setCategory] = useState<Category | null>(null);
  const [sort, setSort] = useState<PostSort>("LATEST");
  const [jobCategoryId, setJobCategoryId] = useState<number | null>(null);
  const [experienceLevelId, setExperienceLevelId] = useState<number | null>(null);
  const [jobOptions, setJobOptions] = useState<JobCategoryOption[]>([]);
  const [levelOptions, setLevelOptions] = useState<ExperienceLevelOption[]>([]);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PostListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await communityAPI.getPosts({
        category: category ?? undefined,
        sort,
        jobCategoryId: jobCategoryId ?? undefined,
        experienceLevelId: experienceLevelId ?? undefined,
        page,
        size: 5,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글을 불러올 수 없어요.");
    } finally {
      setIsLoading(false);
    }
  }, [category, experienceLevelId, jobCategoryId, page, sort]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categories, levels] = await Promise.all([
          referenceAPI.getJobCategories(),
          referenceAPI.getExperienceLevels(),
        ]);
        setJobOptions(
          flattenJobCategories(categories ?? []).filter((option) =>
            COMMUNITY_JOB_SLUGS.includes(option.slug)
          )
        );
        setLevelOptions(levels ?? []);
      } catch {
        setJobOptions([]);
        setLevelOptions([]);
      }
    };

    loadFilters();
  }, []);

  const changeCategory = (value: Category | null) => {
    setCategory(value);
    setPage(0);
  };

  const changeSort = (value: PostSort) => {
    setSort(value);
    setPage(0);
  };

  const resetFilters = () => {
    setSort("LATEST");
    setJobCategoryId(null);
    setExperienceLevelId(null);
    setPage(0);
  };

  const hasListFilters = sort !== "LATEST" || jobCategoryId != null || experienceLevelId != null;

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <Topbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">커뮤니티</h1>
            <p className="mt-2 text-sm text-bodyfont3">
              같은 업계의 디자이너들과 정보를 공유하세요
            </p>
          </div>
          <Link
            href="/community/write"
            className="shrink-0 rounded-xl border border-main100 bg-white px-[23px] py-2.5 text-sm font-semibold text-main100 transition hover:bg-main25"
          >
            글쓰기
          </Link>
        </div>

        {/* 카테고리 탭 */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => {
            const isActive = category === tab.value;
            const isDimmed = category === null && tab.value !== null;
            return (
              <button
                key={tab.label}
                onClick={() => changeCategory(tab.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-main100 bg-main25 text-main100"
                    : isDimmed
                    ? "border-gray-200 bg-gray-100 text-gray-400"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500">정렬</span>
            <div className="flex w-fit rounded-lg border border-gray-200 bg-gray-50 p-1">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => changeSort(option.value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                    sort === option.value
                      ? "bg-white text-main100 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
              직군
              <select
                value={jobCategoryId ?? ""}
                onChange={(e) => {
                  setJobCategoryId(e.target.value ? Number(e.target.value) : null);
                  setPage(0);
                }}
                className="min-w-[150px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 outline-none transition focus:border-main100"
              >
                <option value="">전체 직군</option>
                {jobOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
              연차
              <select
                value={experienceLevelId ?? ""}
                onChange={(e) => {
                  setExperienceLevelId(e.target.value ? Number(e.target.value) : null);
                  setPage(0);
                }}
                className="min-w-[160px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 outline-none transition focus:border-main100"
              >
                <option value="">전체 연차</option>
                {levelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {stripLevelTier(option.label)}
                  </option>
                ))}
              </select>
            </label>

            {hasListFilters && (
              <button
                onClick={resetFilters}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-main25 border-t-main100" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-500">{error}</div>
        ) : (
          <>
            {/* 전체 목록 */}
            <div className="mt-6">
              {!data || data.posts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                  <p className="text-sm text-gray-400">아직 게시글이 없어요.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {data.posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {data && data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-30"
                >
                  이전
                </button>
                <span className="text-sm text-gray-500">
                  {page + 1} / {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={page >= data.totalPages - 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-30"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
