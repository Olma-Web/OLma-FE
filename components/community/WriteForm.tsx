"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { communityAPI } from "@/lib/api";

type Category = "QNA" | "INFO" | "FREE";

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "QNA", label: "Q&A(실무/세무)" },
  { value: "INFO", label: "정보/꿀팁" },
  { value: "FREE", label: "자유/푸념" },
];

export default function WriteForm() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("FREE");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isActive = title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = async () => {
    if (!isActive || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const post = await communityAPI.createPost({
        title: title.trim(),
        content: content.trim(),
        category,
      });
      router.push(`/community/${post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 등록에 실패했어요.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 카테고리 */}
      <div className="flex gap-2">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCategory(opt.value)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
              category === opt.value
                ? "border-main100 bg-main25 text-main100"
                : "border-gray-200 text-gray-500"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 제목 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        maxLength={120}
        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-main100 focus:outline-none"
      />

      {/* 본문 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요"
        maxLength={10000}
        rows={12}
        className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm leading-relaxed focus:border-main100 focus:outline-none"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!isActive || isSubmitting}
        className={`mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition-all ${
          isActive && !isSubmitting
            ? "bg-gradient-to-r from-main100 to-sub175 hover:brightness-105 cursor-pointer"
            : "bg-line1 text-bodyfont4 cursor-not-allowed"
        }`}
      >
        {isSubmitting ? "등록 중..." : "등록하기"}
      </button>
    </div>
  );
}
