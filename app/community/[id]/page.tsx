"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ThumbsUp, MessageCircle, Flag, Send } from "lucide-react";
import Topbar from "@/components/topbar";
import ReportModal from "@/components/community/ReportModal";
import { communityAPI } from "@/lib/api";

type Category = "QNA" | "INFO" | "FREE";
type ReportReason = "ABUSE" | "FALSE_INFO" | "SPAM" | "ETC";

interface Author {
  id: number;
  nickname: string;
  jobCategoryName: string | null;
  experienceLevelLabel: string | null;
  badgeLabel: string | null;
}

interface Comment {
  id: number;
  parentCommentId: number | null;
  content: string;
  author: Author;
  createdAt: string;
  replies: Comment[];
}

interface PostDetail {
  id: number;
  category: Category;
  title: string;
  content: string;
  author: Author;
  imageUrls: string[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
  comments: Comment[];
}

const CATEGORY_LABEL: Record<Category, string> = {
  QNA: "질문",
  INFO: "정보공유",
  FREE: "자유",
};

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

function insertReply(comments: Comment[], parentId: number, reply: Comment): Comment[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...(c.replies ?? []), reply] };
    }
    if (c.replies?.length) {
      return { ...c, replies: insertReply(c.replies, parentId, reply) };
    }
    return c;
  });
}

function AuthorBadge({ author, time }: { author: Author; time?: string }) {
  const parts = [
    author.jobCategoryName ? stripUiUx(author.jobCategoryName) : null,
    author.experienceLevelLabel ? stripLevelTier(author.experienceLevelLabel) : null,
  ].filter(Boolean);
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 shrink-0 rounded-full bg-main25" />
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-gray-800">{author.nickname}</span>
        {parts.length > 0 && (
          <span className="text-xs font-semibold text-main100">
            {parts.join(" / ")}
          </span>
        )}
        {time && <span className="text-xs text-gray-400">{time}</span>}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  depth = 0,
  replyingTo,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  onReport,
}: {
  comment: Comment;
  depth?: number;
  replyingTo: number | null;
  onStartReply: (id: number) => void;
  onCancelReply: () => void;
  onSubmitReply: (parentId: number, content: string) => Promise<void>;
  onReport: (commentId: number) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isReplying = replyingTo === comment.id;

  const submit = async () => {
    if (!replyText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmitReply(comment.id, replyText.trim());
      setReplyText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={depth > 0 ? "ml-10 border-l-2 border-gray-100 pl-4" : ""}>
      <div className="py-4">
        {/* 작성자 */}
        <div className="mb-2">
          <AuthorBadge author={comment.author} time={timeAgo(comment.createdAt)} />
        </div>

        {/* 본문 */}
        <p className="text-sm text-gray-800 whitespace-pre-wrap pl-10">{comment.content}</p>
      </div>

      {/* 대댓글 */}
      {comment.replies?.length > 0 && (
        <div className="flex flex-col">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              replyingTo={replyingTo}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onSubmitReply={onSubmitReply}
              onReport={onReport}
            />
          ))}
        </div>
      )}

      {/* 액션 */}
      {depth === 0 && (
        <div className="pb-4 pl-10 flex items-center justify-end text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <button
              onClick={() => isReplying ? onCancelReply() : onStartReply(comment.id)}
              className="text-black hover:text-main100 transition-colors"
            >
              {isReplying ? "취소" : "답글쓰기"}
            </button>
            <span className="flex items-center gap-1">
              <ThumbsUp size={11} />
              {0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={11} />
              {comment.replies?.length ?? 0}
            </span>
          </div>
        </div>
      )}

      {/* 답글 입력 */}
      {isReplying && (
        <div className="pb-4 pl-10 flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="답글을 입력하세요"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-main100 focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={!replyText.trim() || isSubmitting}
            className="shrink-0 rounded-lg bg-main100 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            등록
          </button>
        </div>
      )}
    </div>
  );
}

export default function CommunityPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "post" | "comment"; id: number } | null>(null);

  const loadPost = useCallback(async () => {
    if (!postId || Number.isNaN(postId)) {
      setError("잘못된 게시글이에요.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await communityAPI.getPost(postId);
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글을 불러올 수 없어요.");
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const toggleLike = async () => {
    if (!post || isLiking) return;
    setIsLiking(true);
    const wasLiked = post.likedByMe;
    setPost({ ...post, likedByMe: !wasLiked, likeCount: post.likeCount + (wasLiked ? -1 : 1) });
    try {
      if (wasLiked) await communityAPI.unlikePost(post.id);
      else await communityAPI.likePost(post.id);
    } catch {
      setPost((prev) => prev && { ...prev, likedByMe: wasLiked, likeCount: prev.likeCount + (wasLiked ? 1 : -1) });
    } finally {
      setIsLiking(false);
    }
  };

  const submitTopLevelComment = async () => {
    if (!post || !commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const newComment: Comment = await communityAPI.createComment(post.id, { content: commentText.trim() });
      setPost({
        ...post,
        comments: [...post.comments, { ...newComment, replies: newComment.replies ?? [] }],
        commentCount: post.commentCount + 1,
      });
      setCommentText("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "댓글 등록에 실패했어요.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const submitReply = async (parentId: number, content: string) => {
    if (!post) return;
    try {
      const newComment: Comment = await communityAPI.createComment(post.id, { content, parentCommentId: parentId });
      setPost({
        ...post,
        comments: insertReply(post.comments, parentId, { ...newComment, replies: newComment.replies ?? [] }),
        commentCount: post.commentCount + 1,
      });
      setReplyingTo(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "답글 등록에 실패했어요.");
    }
  };

  const handleReport = async (reason: ReportReason, detail?: string) => {
    if (!reportTarget) return;
    if (reportTarget.type === "post") {
      await communityAPI.reportPost(reportTarget.id, { reason, detail });
    } else {
      await communityAPI.reportComment(reportTarget.id, { reason, detail });
    }
    alert("신고가 접수됐어요.");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <Topbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-6">

        {/* 목록으로 */}
        <button
          onClick={() => router.push("/community")}
          className="mb-8 flex items-center gap-1 text-sm text-gray-500 hover:text-main100 transition-colors"
        >
          <ChevronLeft size={15} />
          목록으로 돌아가기
        </button>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-main25 border-t-main100" />
          </div>
        ) : error || !post ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-500">{error ?? "게시글을 찾을 수 없어요."}</p>
            <Link href="/community" className="mt-4 inline-block rounded-xl bg-main100 px-5 py-2.5 text-sm font-semibold text-white">
              목록으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            {/* 작성자 + 시간 */}
            <div className="mb-4">
              <AuthorBadge author={post.author} time={timeAgo(post.createdAt)} />
            </div>

            {/* 제목 */}
            <h1 className="text-xl font-extrabold text-gray-900 mb-6">{post.title}</h1>

            {/* 본문 */}
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">
              {post.content}
            </p>

            {/* 이미지 */}
            {post.imageUrls.length > 0 && (
              <div className="flex flex-col gap-3 mb-6">
                {post.imageUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" className="w-full rounded-xl border border-gray-100" />
                ))}
              </div>
            )}

            {/* 좋아요 / 댓글 / 신고 */}
            <div className="flex items-center justify-between py-3 border-y border-gray-100 mb-6">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <button
                  onClick={toggleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-1.5 transition-colors ${post.likedByMe ? "text-main100" : "hover:text-main100"}`}
                >
                  <ThumbsUp size={15} className={post.likedByMe ? "fill-main100 text-main100" : ""} />
                  {post.likeCount}
                </button>
                <span className="flex items-center gap-1.5">
                  <MessageCircle size={15} />
                  {post.commentCount}
                </span>
              </div>
              <button
                onClick={() => setReportTarget({ type: "post", id: post.id })}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Flag size={12} />
                신고하기
              </button>
            </div>

            {/* 댓글 입력 */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-5">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요"
                rows={3}
                className="w-full resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <div className="flex justify-end mb-8">
              <button
                onClick={submitTopLevelComment}
                disabled={!commentText.trim() || isSubmittingComment}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-main100 to-sub175 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                <Send size={14} />
                등록하기
              </button>
            </div>

            {/* 댓글 목록 */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-3">댓글 {post.commentCount}개</h2>
              {post.comments.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">아직 댓글이 없어요.</p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100">
                  {post.comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      replyingTo={replyingTo}
                      onStartReply={setReplyingTo}
                      onCancelReply={() => setReplyingTo(null)}
                      onSubmitReply={submitReply}
                      onReport={(commentId) => setReportTarget({ type: "comment", id: commentId })}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {reportTarget && (
        <ReportModal onClose={() => setReportTarget(null)} onSubmit={handleReport} />
      )}
    </div>
  );
}