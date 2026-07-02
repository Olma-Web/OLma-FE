"use client";

import { useState } from "react";

type ReportReason = "ABUSE" | "FALSE_INFO" | "SPAM" | "ETC";

const REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: "ABUSE", label: "욕설/비방" },
  { value: "FALSE_INFO", label: "허위 정보" },
  { value: "SPAM", label: "스팸/광고" },
  { value: "ETC", label: "기타" },
];

interface Props {
  onClose: () => void;
  onSubmit: (reason: ReportReason, detail?: string) => Promise<void>;
}

export default function ReportModal({ onClose, onSubmit }: Props) {
  const [reason, setReason] = useState<ReportReason>("ABUSE");
  const [detail, setDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit(reason, detail || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "신고 접수에 실패했어요.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-6 shadow-xl">
        <h2 className="text-base font-bold text-gray-900">신고하기</h2>

        <div className="mt-4 flex flex-col gap-2">
          {REASON_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                reason === opt.value
                  ? "border-main100 bg-main25 text-main100"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              <input
                type="radio"
                name="reportReason"
                checked={reason === opt.value}
                onChange={() => setReason(opt.value)}
                className="accent-main100"
              />
              {opt.label}
            </label>
          ))}
        </div>

        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="상세 사유 (선택)"
          maxLength={1000}
          rows={3}
          className="mt-3 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-main100 focus:outline-none"
        />

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-gradient-to-r from-main100 to-sub175 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
          >
            {isSubmitting ? "접수 중..." : "신고하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
