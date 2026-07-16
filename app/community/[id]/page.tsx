"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ThumbsUp, MessageCircle, Send, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Topbar from "@/components/topbar";
import { communityAPI } from "@/lib/api";

type Category = "QNA" | "INFO" | "FREE";

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
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  replies: Comment[];
}

// 백엔드가 답글을 이미 부모 댓글의 replies로 중첩해서 내려줄 수도, parentCommentId만 채운
// 평평한 배열로 내려줄 수도 있어서 두 경우 모두 안전하게 처리한다.
interface RawComment {
  id: number;
  parentCommentId: number | null;
  content: string;
  author: Author;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  replies?: RawComment[];
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

function flattenRawComments(comments: RawComment[]): Omit<RawComment, "replies">[] {
  const result: Omit<RawComment, "replies">[] = [];
  const walk = (list: RawComment[]) => {
    for (const { replies, ...rest } of list) {
      result.push(rest);
      if (replies?.length) walk(replies);
    }
  };
  walk(comments);
  return result;
}

function buildCommentTree(rawComments: RawComment[]): Comment[] {
  const flatComments = flattenRawComments(rawComments);
  const byId = new Map<number, Comment>(
    flatComments.map((c) => [c.id, { ...c, replies: [] }])
  );
  const roots: Comment[] = [];

  for (const comment of byId.values()) {
    if (comment.parentCommentId != null && byId.has(comment.parentCommentId)) {
      byId.get(comment.parentCommentId)!.replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}

const CATEGORY_LABEL: Record<Category, string> = {
  QNA: "Q&A",
  INFO: "정보",
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

function editCommentInTree(comments: Comment[], commentId: number, content: string): Comment[] {
  return comments.map((c) => {
    if (c.id === commentId) return { ...c, content };
    if (c.replies?.length) return { ...c, replies: editCommentInTree(c.replies, commentId, content) };
    return c;
  });
}

function deleteCommentFromTree(comments: Comment[], commentId: number): Comment[] {
  return comments
    .filter((c) => c.id !== commentId)
    .map((c) => (c.replies?.length ? { ...c, replies: deleteCommentFromTree(c.replies, commentId) } : c));
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

function ConfirmDialog({
  title,
  description,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-lg font-bold text-gray-900">{title}</p>
        <p className="mt-3 text-sm text-gray-500">{description}</p>
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <MoreVertical size={18} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
            <button
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Pencil size={14} />
              수정하기
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
            >
              <Trash2 size={14} />
              삭제하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  depth = 0,
  currentUserId,
  replyingTo,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  onEditComment,
  onDeleteComment,
}: {
  comment: Comment;
  depth?: number;
  currentUserId: number | null;
  replyingTo: number | null;
  onStartReply: (id: number) => void;
  onCancelReply: () => void;
  onSubmitReply: (parentId: number, content: string) => Promise<void>;
  onEditComment: (commentId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
}) {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.likedByMe);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isReplying = replyingTo === comment.id;
  const isAuthor = currentUserId != null && comment.author.id === currentUserId;

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

  const saveEdit = async () => {
    if (!editText.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await onEditComment(comment.id, editText.trim());
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "댓글 수정에 실패했어요.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const remove = async () => {
    setShowDeleteConfirm(false);
    try {
      await onDeleteComment(comment.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "댓글 삭제에 실패했어요.");
    }
  };

  const toggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      if (wasLiked) await communityAPI.unlikeComment(comment.id);
      else await communityAPI.likeComment(comment.id);
    } catch (err) {
      setIsLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
      alert(err instanceof Error ? err.message : "좋아요 처리에 실패했어요.");
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className={depth > 0 ? "ml-10 border-l-2 border-gray-100 pl-4" : ""}>
      <div className="py-4">
        {/* 작성자 */}
        <div className="mb-2 flex items-start justify-between">
          <AuthorBadge author={comment.author} time={timeAgo(comment.createdAt)} />
          {isAuthor && (
            <OptionsMenu
              onEdit={() => {
                setEditText(comment.content);
                setIsEditing(true);
              }}
              onDelete={() => setShowDeleteConfirm(true)}
            />
          )}
        </div>

        {/* 본문 */}
        {isEditing ? (
          <div className="flex flex-col gap-2 pl-10">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-main100 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={saveEdit}
                disabled={!editText.trim() || isSavingEdit}
                className="rounded-lg bg-main100 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 whitespace-pre-wrap pl-10">{comment.content}</p>
        )}
      </div>

      {/* 액션 */}
      <div className="pb-4 pl-10 flex items-center justify-between text-xs text-gray-400">
        {depth === 0 ? (
          <button
            onClick={() => isReplying ? onCancelReply() : onStartReply(comment.id)}
            className="text-black hover:text-main100 transition-colors"
          >
            {isReplying ? "취소" : "답글쓰기"}
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLike}
            disabled={isLiking}
            className={`flex items-center gap-1 transition-colors ${isLiked ? "text-main100" : "hover:text-main100"}`}
          >
            <ThumbsUp size={11} className={isLiked ? "fill-main100 text-main100" : ""} />
            {likeCount}
          </button>
          {depth === 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle size={11} />
              {comment.replies?.length ?? 0}
            </span>
          )}
        </div>
      </div>

      {/* 답글 입력 */}
      {isReplying && (
        <div className="pb-4 pl-10">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="답글을 입력하세요"
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={submit}
              disabled={!replyText.trim() || isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-main100 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              <Send size={14} />
              등록하기
            </button>
          </div>
        </div>
      )}

      {/* 대댓글 */}
      {comment.replies?.length > 0 && (
        <div className="flex flex-col">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onSubmitReply={onSubmitReply}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="댓글을 삭제하시겠습니까?"
          description="이 작업은 되돌릴 수 없습니다."
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={remove}
        />
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
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const currentUserId = typeof window !== "undefined" ? Number(localStorage.getItem("userId")) : null;

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
      setPost({ ...data, comments: buildCommentTree(data.comments) });
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

  const editComment = async (commentId: number, content: string) => {
    await communityAPI.updateComment(commentId, { content });
    setPost((prev) => prev && { ...prev, comments: editCommentInTree(prev.comments, commentId, content) });
  };

  const deleteComment = async (commentId: number) => {
    await communityAPI.deleteComment(commentId);
    setPost(
      (prev) =>
        prev && {
          ...prev,
          comments: deleteCommentFromTree(prev.comments, commentId),
          commentCount: Math.max(0, prev.commentCount - 1),
        }
    );
  };

  const deletePost = async () => {
    if (!post) return;
    setShowDeletePostConfirm(false);
    try {
      await communityAPI.deletePost(post.id);
      router.push("/community");
    } catch (err) {
      alert(err instanceof Error ? err.message : "게시글 삭제에 실패했어요.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <Topbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-6">

        {/* 목록으로 */}
        <button
          onClick={() => router.push("/community")}
          className="mb-8 flex items-center gap-1 text-sm font-semibold text-black hover:text-main100 transition-colors"
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
            <div className="mb-4 flex items-start justify-between">
              <AuthorBadge author={post.author} />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
                {currentUserId != null && post.author.id === currentUserId && (
                  <OptionsMenu
                    onEdit={() => router.push(`/community/${post.id}/edit`)}
                    onDelete={() => setShowDeletePostConfirm(true)}
                  />
                )}
              </div>
            </div>

            {/* 제목 */}
            <h1 className="text-xl font-extrabold text-gray-900 mb-6">{post.title}</h1>

            {/* 본문 */}
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-10">
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

            {/* 좋아요 / 댓글 */}
            <div className="flex items-center justify-between py-3 border-y border-gray-100 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <button
                  onClick={toggleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-colors ${
                    post.likedByMe
                      ? "border-sky-100 bg-sky-100 text-sky-500"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <ThumbsUp size={15} className={post.likedByMe ? "text-sky-500" : ""} />
                  {post.likeCount}
                </button>
                <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-gray-500">
                  <MessageCircle size={15} />
                  {post.commentCount}
                </span>
              </div>
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
                className="flex items-center gap-1.5 rounded-xl bg-main100 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
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
                      currentUserId={currentUserId}
                      replyingTo={replyingTo}
                      onStartReply={setReplyingTo}
                      onCancelReply={() => setReplyingTo(null)}
                      onSubmitReply={submitReply}
                      onEditComment={editComment}
                      onDeleteComment={deleteComment}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showDeletePostConfirm && (
        <ConfirmDialog
          title="게시글을 삭제하시겠습니까?"
          description="이 작업은 되돌릴 수 없습니다."
          onCancel={() => setShowDeletePostConfirm(false)}
          onConfirm={deletePost}
        />
      )}
    </div>
  );
}