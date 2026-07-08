"use client";

import { useState, useRef } from "react";
import { type EstimateNegotiationResult, type EstimateResult } from "@/lib/estimate/constants";

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
  onSave: (projectName?: string, negotiationTargetBudgetAmount?: number) => Promise<void>;
  onSimulateNegotiation: (targetBudgetAmount: number) => Promise<EstimateNegotiationResult>;
}

export default function EstimateModal({ result, nickname, onClose, onSave, onSimulateNegotiation }: Props) {
  const [mode, setMode] = useState<"view" | "save">("view");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [targetBudget, setTargetBudget] = useState("");
  const [negotiationResult, setNegotiationResult] = useState<EstimateNegotiationResult | null>(null);
  const [negotiationStatus, setNegotiationStatus] = useState<"idle" | "loading" | "error">("idle");
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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
      await onSave(projectName.trim() || undefined, negotiationResult?.targetBudgetAmount);
      setSaveStatus("saved");
      setTimeout(() => {
        onClose();
        setProjectName("");
      }, 800);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleNegotiation = async () => {
    const amount = Number(targetBudget);
    if (!amount || amount <= 0 || negotiationStatus === "loading") return;
    setNegotiationStatus("loading");
    try {
      const data = await onSimulateNegotiation(amount);
      setNegotiationResult(data);
      setNegotiationStatus("idle");
    } catch {
      setNegotiationStatus("error");
    }
  };

  const handleImageSave = async () => {
    const captureTarget = contentRef.current ?? modalRef.current;
    if (!captureTarget) return;
    const html2canvas = (await import("html2canvas-pro")).default;
    const captureHeight = captureTarget.scrollHeight - (buttonsRef.current?.offsetHeight ?? 0);
    const canvas = await html2canvas(captureTarget, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div ref={modalRef} className="flex max-h-[calc(100vh-48px)] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl">

        <div className={`flex shrink-0 justify-between items-center px-8 pt-8 ${mode === "view" ? "mb-6" : "mb-2"}`}>
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

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
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

            <div className="mb-8 rounded-xl border border-line2 bg-white px-5 py-5">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-titlefont1">견적 협상 시뮬레이터</h3>
                <p className="mt-1 text-xs text-bodyfont3">
                  클라이언트 예산을 입력하면 가격 대신 조정할 범위를 제안합니다.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={targetBudget}
                  onChange={(e) => setTargetBudget(e.target.value)}
                  placeholder="예: 3000000"
                  className="min-w-0 flex-1 rounded-lg border border-line1 bg-bg2 px-4 py-3 text-sm text-titlefont2 placeholder:text-bodyfont4 focus:border-main75 focus:outline-none focus:ring-2 focus:ring-main25"
                />
                <button
                  onClick={handleNegotiation}
                  disabled={!Number(targetBudget) || negotiationStatus === "loading"}
                  className="shrink-0 rounded-lg bg-main100 px-4 py-3 text-sm font-semibold text-white transition hover:bg-main75 disabled:bg-line1 disabled:text-bodyfont4"
                >
                  {negotiationStatus === "loading" ? "생성 중..." : "협상안 생성"}
                </button>
              </div>

              {negotiationStatus === "error" && (
                <p className="mt-3 text-xs text-red-500">협상안을 생성하지 못했습니다.</p>
              )}

              {negotiationResult && (
                <div className="mt-5 flex flex-col gap-4">
                  <div className="rounded-lg bg-bg2 px-4 py-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-bodyfont3">예산 차이</span>
                      <span className="font-bold text-main100">
                        ₩{toMan(negotiationResult.gapAmount).toLocaleString()}만 원
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-bodyfont2">{negotiationResult.clientMessage}</p>
                  </div>

                  {negotiationResult.options.map((option) => (
                    <div
                      key={option.type}
                      className={`rounded-xl border px-4 py-3 ${
                        negotiationResult.recommendedOptionType === option.type
                          ? "border-main100 bg-main25"
                          : "border-line2 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-titlefont1">
                            {option.title}
                            {negotiationResult.recommendedOptionType === option.type && (
                              <span className="ml-2 rounded-md bg-main100 px-2 py-0.5 text-xs text-white">
                                추천
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-xs text-bodyfont3">
                            조정 후 ₩{toMan(option.adjustedAmount).toLocaleString()}만 원 · 절감 ₩{toMan(option.savingAmount).toLocaleString()}만 원
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-bodyfont2">
                          {option.adjustedScreenCount}화면
                        </span>
                      </div>
                      <ul className="mt-3 flex flex-col gap-1 text-xs text-bodyfont2">
                        {option.adjustments.map((item) => (
                          <li key={`${option.type}-${item}`}>- {item}</li>
                        ))}
                      </ul>
                      <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs leading-5 text-bodyfont2">
                        {option.clientMessage}
                      </p>
                    </div>
                  ))}
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
            <div className="mb-8">
              <h3 className="text-xl font-bold text-titlefont1 mb-2">견적서를 저장하세요</h3>
              <p className="text-sm text-bodyfont3">
                이 분석 결과를 나중에 찾을 수 있도록 이름을 붙여 커리어 보관함에 옮겨두세요.
              </p>
            </div>

            <div className="mb-8 rounded-xl bg-gray-50 px-6 py-6">
              <div className="mb-6">
                <label className="block text-xs font-bold text-titlefont1 mb-3">
                  프로젝트명
                </label>
                <div className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-main100 flex items-center justify-center text-white text-xs font-bold">
                    📋
                  </div>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="프로젝트명 입력"
                    className="flex-1 rounded-lg bg-white border border-line1 px-4 py-3 text-sm text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 focus:ring-main100"
                  />
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-bodyfont3">직군</span>
                  <span className="font-medium text-titlefont1">{result.jobCategoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-bodyfont3">경력</span>
                  <span className="font-medium text-titlefont1">{result.experienceLevelLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-bodyfont3">플랫폼</span>
                  <span className="font-medium text-titlefont1">{platformLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-bodyfont3">내 단가</span>
                  <span className="font-medium text-titlefont1">₩{toMan(finalAmount).toLocaleString()}만 원</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMode("view")}
                disabled={saveStatus === "saving"}
                className="flex-1 rounded-2xl border border-line1 py-3 text-sm font-semibold text-titlefont1 hover:bg-gray-50 transition-all cursor-pointer disabled:cursor-default disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === "saving" || saveStatus === "saved"}
                className="flex-1 rounded-2xl bg-main100 py-3 text-sm font-semibold text-white hover:brightness-110 transition-all cursor-pointer disabled:cursor-default disabled:opacity-70"
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
    </div>
  );
}
