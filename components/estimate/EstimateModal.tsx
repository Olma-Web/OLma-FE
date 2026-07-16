"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { type EstimateResult } from "@/lib/estimate/constants";

const toMan = (won: number) => Math.round(won / 10000);

const formatToday = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd} 견적서`;
};

const ADDON_LABEL: Record<string, string> = {
  "화면 프로토타이핑": "화면 프로토타이핑",
  "개발자용 디자인 시스템 구축": "개발자용 디자인 시스템 구축",
  "Figma 등 원본 소스 전송": "Figma 등 원본 소스 전송",
};

interface Props {
  result: EstimateResult;
  nickname: string;
  onClose: () => void;
  // 이미 저장된 견적서를 다시 열어보는 경우(읽기 전용)에는 전달하지 않는다 — 저장 버튼이 없으면 중복 생성을 막을 수 있다.
  onSave?: (projectName?: string, negotiationTargetBudgetAmount?: number) => Promise<void>;
  // 같은 견적을 이미 저장한 뒤 모달을 다시 연 경우, 저장 버튼을 처음부터 잠긴("저장됨") 상태로
  // 보여줘 재클릭으로 인한 중복 저장을 막는다.
  initialSaved?: boolean;
}

export default function EstimateModal({ result, nickname, onClose, onSave, initialSaved }: Props) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    initialSaved ? "saved" : "idle",
  );
  const projectNameInputRef = useRef<HTMLInputElement>(null);

  const {
    finalAmount, screenCount, baseRatePerScreen, step1BasicFee,
    uxMultiplier, step2UxFee, platformMultiplier, step3PlatformFee,
    addonPercent, step4AddonFee, addons,
  } = result;

  const [projectName, setProjectName] = useState(formatToday);

  const handleSave = async () => {
    if (!onSave || saveStatus === "saving" || saveStatus === "saved") return;
    setSaveStatus("saving");
    try {
      await onSave(projectName.trim() || undefined);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[calc(100vh-48px)] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl">

        <div className="flex shrink-0 justify-between items-center px-8 pt-8 mb-6">
          <h2 className="font-bold text-titlefont1 text-lg">
            <span className="text-main100 text-2xl">{nickname || "User"}</span>님의 견적서
          </h2>
          <button onClick={onClose} className="text-bodyfont4 hover:text-titlefont1 transition-colors">
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
            <div className="flex justify-between items-center rounded-xl px-5 py-4 mb-6"
              style={{ background: "linear-gradient(135deg, #e8e0ff 0%, #d6e8ff 40%, #c8f0ff 70%, #dde0ff 100%)" }}>
              <span className="text-sm text-bodyfont2">권장 최소 방어 견적</span>
              <span className="text-lg font-bold text-main100">{toMan(finalAmount).toLocaleString()}만 원</span>
            </div>

            <div className="rounded-xl bg-bg2 px-5 flex flex-col text-sm text-bodyfont2 mb-8">
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

            {onSave && (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-titlefont1 mb-3">프로젝트명</label>
                  <div className="relative">
                    <input
                      ref={projectNameInputRef}
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="프로젝트명을 입력해주세요"
                      className="w-full rounded-lg border border-line1 bg-bg2 px-4 py-3 pr-10 text-sm tracking-wide text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 focus:ring-main25 focus:border-main75"
                    />
                    <div className="group absolute right-3 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => projectNameInputRef.current?.focus()}
                        className="rounded-full p-1 text-bodyfont4 opacity-70 transition hover:bg-gray-100 hover:opacity-100 cursor-pointer"
                        aria-label="프로젝트명 수정"
                      >
                        <Image src="/edit.svg" alt="" width={16} height={16} />
                      </button>
                      <span className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded-md bg-titlefont1 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                        수정하기
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saveStatus === "saving" || saveStatus === "saved"}
                  className={`w-full rounded-2xl py-3 text-sm font-semibold transition-all cursor-pointer disabled:cursor-default ${
                    saveStatus === "saved"
                      ? "bg-line1 text-bodyfont4"
                      : "bg-main100 text-white hover:bg-main75 disabled:opacity-70"
                  }`}
                >
                  {saveStatus === "saving" && "저장 중..."}
                  {saveStatus === "saved" && "저장됨"}
                  {saveStatus === "error" && "저장 실패"}
                  {saveStatus === "idle" && "내 보관함에 저장하기"}
                </button>
              </>
            )}
        </div>

      </div>
    </div>
  );
}
