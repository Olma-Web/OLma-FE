"use client";

import { useState } from "react";

const ADDON_LABEL: Record<string, string> = {
  DESIGN_SYSTEM: "개발자용 디자인 시스템 구축",
  PROTOTYPING: "화면 프로토타이핑",
  SOURCE_TRANSFER: "Figma 등 원본 소스 전송",
};

const toMan = (won: number) => Math.round(won / 10000);

interface Props {
  result: Record<string, unknown>;
  onClose: () => void;
  onSave: () => Promise<void>;
}

export default function EstimateModal({ result, onClose, onSave }: Props) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const finalAmount = result.finalAmount as number;
  const screenCount = result.screenCount as number;
  const step1BasicFee = result.step1BasicFee as number;
  const uxMultiplier = result.uxMultiplier as number;
  const step2UxFee = result.step2UxFee as number;
  const platformMultiplier = result.platformMultiplier as number;
  const step3PlatformFee = result.step3PlatformFee as number;
  const addonPercent = result.addonPercent as number;
  const step4AddonFee = result.step4AddonFee as number;
  const addons = result.addons as string[];

  const handleSave = async () => {
    if (saveStatus === "saving" || saveStatus === "saved") return;
    setSaveStatus("saving");
    try {
      await onSave();
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white px-8 py-8 shadow-xl">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-titlefont1">
            <span className="text-main100 text-2xl">User</span>님의 견적서
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
            <span>{screenCount}화면 x 100만 원 = {toMan(step1BasicFee).toLocaleString()}만 원</span>
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
              <span>{addons?.map((a) => ADDON_LABEL[a]).join(", ")}</span>
              <span>+{toMan(step4AddonFee).toLocaleString()}만 원 (+{addonPercent}%)</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving" || saveStatus === "saved"}
            className="flex-1 rounded-2xl bg-gradient-to-r from-main100 to-sub175 py-3 text-sm font-semibold text-white hover:brightness-105 transition-all cursor-pointer disabled:cursor-default disabled:opacity-70"
          >
            {saveStatus === "saving" && "저장 중..."}
            {saveStatus === "saved" && "저장되었습니다"}
            {saveStatus === "error" && "저장 실패"}
            {saveStatus === "idle" && "내 보관함에 저장하기"}
          </button>
          <button className="flex-1 rounded-2xl border border-main100 py-3 text-sm font-semibold text-main100 hover:bg-main25 transition-all cursor-pointer">
            이미지로 저장하기
          </button>
        </div>

      </div>
    </div>
  );
}