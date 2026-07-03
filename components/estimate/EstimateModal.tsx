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
  const [mode, setMode] = useState<"view" | "save">("view");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  const {
    finalAmount, screenCount, baseRatePerScreen, step1BasicFee,
    uxMultiplier, step2UxFee, platformMultiplier, platformLabel, step3PlatformFee,
    addonPercent, step4AddonFee, addons,
  } = result;

  const [projectName, setProjectName] = useState("");

  const openSaveForm = () => {
    setSaveStatus("idle");
    setMode("save");
  };

  const handleSave = async () => {
    if (saveStatus === "saving" || saveStatus === "saved") return;
    setSaveStatus("saving");
    try {
      await onSave(projectName.trim() || undefined);
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
    });
    const link = document.createElement("a");
    link.download = "견적서.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div ref={modalRef} className="w-full max-w-xl rounded-2xl bg-white px-8 py-8 shadow-xl">

        <div className={`flex justify-between items-center ${mode === "view" ? "mb-6" : "mb-2"}`}>
          <h2 className={`font-bold text-titlefont1 ${mode === "view" ? "text-lg" : "text-[19.8px]"}`}>
            {mode === "view" ? (
              <>
                <span className="text-main100 text-2xl">{nickname || "User"}</span>님의 견적서
              </>
            ) : (
              "커리어 보관함에 저장"
            )}
          </h2>
          <button onClick={onClose} className="text-bodyfont4 hover:text-titlefont1 transition-colors">
            ✕
          </button>
        </div>

        {mode === "view" ? (
          <>
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

            <div ref={buttonsRef} className="flex gap-3" data-html2canvas-ignore="true">
              <button
                onClick={openSaveForm}
                className="flex-1 rounded-2xl bg-gradient-to-r from-main100 to-sub175 py-3 text-sm font-semibold text-white hover:brightness-105 transition-all cursor-pointer"
              >
                내 보관함에 저장하기
              </button>
              <button
                onClick={handleImageSave}
                className="flex-1 rounded-2xl border border-main100 py-3 text-sm font-semibold text-main100 hover:bg-main25 transition-all cursor-pointer"
              >
                이미지로 저장하기
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-bodyfont3 mb-6">
              나중에 쉽게 찾을 수 있도록 이 견적서에 이름을 붙여주세요
            </p>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                프로젝트명
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="예: 쇼핑몰 앱 리디자인"
                className="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-main100 mb-5"
              />
              <div className="w-full rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-500 flex flex-col gap-1">
                <span><span className="font-medium text-gray-700">플랫폼:</span> {platformLabel}</span>
                <span><span className="font-medium text-gray-700">화면 수:</span> {screenCount}개</span>
                <span><span className="font-medium text-gray-700">견적 금액:</span> <span className="font-medium text-gray-700">{toMan(finalAmount).toLocaleString()}</span>만원</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMode("view")}
                disabled={saveStatus === "saving"}
                className="flex-1 rounded-2xl border border-gray-300 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer disabled:cursor-default disabled:opacity-50"
              >
                이전으로
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === "saving" || saveStatus === "saved"}
                className="flex-1 rounded-2xl bg-gradient-to-r from-main100 to-sub175 py-3 text-sm font-semibold text-white hover:brightness-105 transition-all cursor-pointer disabled:cursor-default disabled:opacity-70"
              >
                {saveStatus === "saving" && "저장 중..."}
                {saveStatus === "saved" && "저장되었습니다"}
                {saveStatus === "error" && "저장 실패"}
                {saveStatus === "idle" && "저장하기"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
