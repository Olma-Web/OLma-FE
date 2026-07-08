"use client";

import { useState } from "react";
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
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectName, setProjectName] = useState("");

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
      setTimeout(() => {
        setShowProjectModal(false);
        setProjectName("");
      }, 800);
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

        <div className="flex gap-3">
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex-1 rounded-2xl bg-gradient-to-r from-main100 to-sub175 py-3 text-sm font-semibold text-white hover:brightness-105 transition-all cursor-pointer"
          >
            내 보관함에 저장하기
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-main100 py-3 text-sm font-semibold text-main100 hover:bg-main25 transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>

      {/* 프로젝트명 입력 모달 */}
      {showProjectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <button
              onClick={() => {
                setShowProjectModal(false);
                setProjectName("");
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-gray-900">견적서 저장하기</h2>
            <p className="mt-1 text-sm text-gray-600">
              이 견적서를 저장할 프로젝트 이름을 설정하세요.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700">
                프로젝트명
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="예: 2024년 Q1 프로젝트"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-main100 focus:outline-none"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowProjectModal(false);
                  setProjectName("");
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className="flex-1 rounded-lg bg-main100 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6a5ee6] disabled:opacity-50"
              >
                {saveStatus === "saving" && "저장 중..."}
                {saveStatus === "saved" && "저장되었습니다"}
                {saveStatus === "error" && "저장 실패"}
                {saveStatus === "idle" && "저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
