"use client";

import { FileText } from "lucide-react";

interface Props {
  nickname: string;
  onShare: () => void;
  onDismiss: () => void;
}

export default function EstimateGateModal({ nickname, onShare, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="relative w-full max-w-md rounded-2xl bg-white px-8 py-10 text-center shadow-xl">
        <button
          onClick={onDismiss}
          aria-label="닫기"
          className="absolute right-4 top-4 text-bodyfont4 hover:text-titlefont1 transition-colors cursor-pointer"
        >
          ✕
        </button>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-main25">
          <FileText className="h-7 w-7 text-main100" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-titlefont1">맞춤형 견적서가 완성되었습니다!</h2>
        <p className="mt-3 text-sm leading-6 text-bodyfont2">
          결과를 확인하려면
          <br />
          {nickname || "회원"}님의 최근 프로젝트 단가를 1개만 공유해주세요.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <button
            onClick={onShare}
            className="w-full rounded-2xl bg-main100 py-3 text-sm font-semibold text-white transition hover:bg-main75 cursor-pointer"
          >
            내 보관함에 저장하기
          </button>
          <button
            onClick={onDismiss}
            className="w-full rounded-2xl border border-line1 py-3 text-sm font-semibold text-bodyfont2 transition hover:bg-gray-50 cursor-pointer"
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
}
