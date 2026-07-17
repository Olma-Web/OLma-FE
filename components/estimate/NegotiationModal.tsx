"use client";

import { useState } from "react";
import { type EstimateNegotiationResult } from "@/hooks/useEstimateChat";

const toMan = (won: number) => Math.round(won / 10000);

interface Props {
  negotiationResult: EstimateNegotiationResult;
  onClose: () => void;
  onSaveTogether: () => Promise<void>;
  // 이미 저장된 협상안을 다시 열어본 경우, 저장 버튼을 처음부터 잠긴 상태로 보여줘
  // estimateAPI 재호출로 중복 저장되는 것을 막는다.
  initialSaved?: boolean;
}

export default function NegotiationModal({ negotiationResult, onClose, onSaveTogether, initialSaved }: Props) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    initialSaved ? "saved" : "idle",
  );

  const handleSave = async () => {
    if (saveStatus === "saving" || saveStatus === "saved") return;
    setSaveStatus("saving");
    try {
      await onSaveTogether();
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[calc(100vh-48px)] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">

        <div className="flex shrink-0 items-start justify-between px-8 pt-8 mb-6">
          <div>
            <h2 className="font-bold text-titlefont1 text-xl">견적 협상 시뮬레이터</h2>
            <p className="mt-1 text-sm text-bodyfont3">클라이언트 예산에 맞는 협상 시나리오를 분석했어요.</p>
          </div>
          <button onClick={onClose} className="text-bodyfont4 hover:text-titlefont1 transition-colors">
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
          <div className="rounded-xl px-5 py-4 mb-6"
            style={{ background: "linear-gradient(135deg, #e8e0ff 0%, #d6e8ff 40%, #c8f0ff 70%, #dde0ff 100%)" }}>
            <div className="flex justify-between items-center">
              <span className="text-sm text-bodyfont2">예산 차이</span>
              <span className="text-lg font-bold text-main100">{toMan(negotiationResult.gapAmount).toLocaleString()}만 원</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-bodyfont2">{negotiationResult.clientMessage}</p>
          </div>

          <div className="flex flex-col gap-3 mb-8">
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
                      조정 후 {toMan(option.adjustedAmount).toLocaleString()}만 원 · 절감 {toMan(option.savingAmount).toLocaleString()}만 원
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
            {saveStatus === "idle" && "견적서와 함께 저장하기"}
          </button>
        </div>

      </div>
    </div>
  );
}
