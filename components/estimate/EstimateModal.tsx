"use client";

import { useState, useRef } from "react";
import { type EstimateResult } from "@/lib/estimate/constants";

const toMan = (won: number) => Math.round(won / 10000);

const ADDON_LABEL: Record<string, string> = {
  "화면 프로토타이핑": "화면 프로토타이핑",
  "개발자용 디자인 시스템 구축": "개발자용 디자인 시스템 구축",
  "Figma 등 원본 소스 전송": "Figma 등 원본 소스 전송",
};

interface Props {
  result: EstimateResult;
  nickname: string;
  onClose: () => void;
  onSave: (projectName?: string) => Promise<void>;
}

export default function EstimateModal({ result, nickname, onClose, onSave }: Props) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [projectName, setProjectName] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  const {
    finalAmount, screenCount, baseRatePerScreen, step1BasicFee,
    uxMultiplier, step2UxFee, platformMultiplier, step3PlatformFee,
    addonPercent, step4AddonFee, addons,
  } = result;

  const handleSave = async () => {
    if (saveStatus === "saving" || saveStatus === "saved") return;
    setSaveStatus("saving");
    try {
      await onSave(projectName || undefined);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleImageSave = async () => {
    if (!modalRef.current) return;
    const html2canvas = (await import("html2canvas-pro")).default;
    const captureHeight = modalRef.current.scrollHeight - (buttonsRef.current?.offsetHeight ?? 0);
    const canvas = await html2canvas(modalRef.current, {
      scale: 2,
      height: captureHeight,
      windowHeight: captureHeight,
      onclone: (clonedDoc) => {
        // html2canvas가 <input> 값의 텍스트 베이스라인을 잘못 계산해 위쪽이 잘리는 문제 회피용
        // (clonedDoc은 별도 iframe 문서라 instanceof HTMLInputElement가 통하지 않아 tagName으로 체크)
        const input = clonedDoc.querySelector('input[type="text"]') as HTMLInputElement | null;
        if (input && input.tagName === "INPUT") {
          const replacement = clonedDoc.createElement("div");
          replacement.className = input.className;
          replacement.style.display = "flex";
          replacement.style.alignItems = "center";
          replacement.style.color = input.value ? "" : "#9ca3af";
          replacement.textContent = input.value || input.placeholder;
          input.replaceWith(replacement);
        }
      },
    });
    const link = document.createElement("a");
    link.download = "견적서.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div ref={modalRef} className="w-full max-w-xl rounded-2xl bg-white px-8 py-8 shadow-xl">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-titlefont1">
            <span className="text-main100 text-2xl">{nickname || "User"}</span>님의 견적서
          </h2>
          <button onClick={onClose} className="text-bodyfont4 hover:text-titlefont1 transition-colors">
            ✕
          </button>
        </div>

        <div className="flex justify-between items-center rounded-xl px-5 py-4 mb-6"
          style={{ background: "linear-gradient(135deg, #e8e0ff 0%, #d6e8ff 40%, #c8f0ff 70%, #dde0ff 100%)" }}>
          <span className="text-sm text-bodyfont2">권장 최소 방어 견적</span>
          <span className="text-lg font-bold text-main100">₩{toMan(finalAmount).toLocaleString()}만 원</span>
        </div>

        <div className="rounded-xl bg-gray-50 px-5 flex flex-col text-sm text-bodyfont2 mb-8">
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span>기본 작업비</span>
            <span>{screenCount}화면 x {toMan(baseRatePerScreen).toLocaleString()}만 원 = {toMan(step1BasicFee).toLocaleString()}만 원</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span>UX 기획 관여도</span>
            <span>x{uxMultiplier} = {toMan(step2UxFee).toLocaleString()}만 원</span>
          </div>
          <div className={`flex justify-between py-3 ${addonPercent > 0 ? "border-b border-gray-200" : ""}`}>
            <span>플랫폼 배수</span>
            <span>x{platformMultiplier} = {toMan(step3PlatformFee).toLocaleString()}만 원</span>
          </div>
          {addonPercent > 0 && (
            <div className="flex justify-between py-3">
              <span>{(addons as string[]).map((a) => ADDON_LABEL[a] || a).join(", ")}</span>
              <span>+{toMan(step4AddonFee).toLocaleString()}만 원 (+{addonPercent}%)</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            프로젝트명
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="예: 2024년 Q1 프로젝트"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-main100 focus:outline-none"
          />
        </div>

        <div ref={buttonsRef} className="flex gap-3" data-html2canvas-ignore="true">
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving" || saveStatus === "saved"}
            className="flex-1 rounded-2xl bg-gradient-to-r from-main100 to-sub175 py-3 text-sm font-semibold text-white hover:brightness-105 transition-all cursor-pointer disabled:cursor-default disabled:opacity-70"
          >
            {saveStatus === "saving" && "저장 중..."}
            {saveStatus === "saved" && "저장되었습니다 ✓"}
            {saveStatus === "error" && "저장 실패"}
            {saveStatus === "idle" && "내 보관함에 저장하기"}
          </button>
          <button
            onClick={handleImageSave}
            className="flex-1 rounded-2xl border border-main100 py-3 text-sm font-semibold text-main100 hover:bg-main25 transition-all cursor-pointer"
          >
            이미지로 저장하기
          </button>
        </div>

      </div>
    </div>
  );
}