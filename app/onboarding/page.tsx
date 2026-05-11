"use client";

import { useState } from "react";
import { getSteps } from "@/lib/onboarding/steps";
import { jobCategoryMap, experienceLevelMap, workFormatMap, durationMap } from "@/lib/onboarding/maps";
import { submissionAPI } from "@/lib/api";
import Topbar from "@/components/topbar";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const steps = getSteps(answers[1] as string, answers[6] as string);
  const totalSteps = steps.length;
  const step = steps[currentStep];
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);
  const isLastStep = currentStep === totalSteps - 1;

  const isSelected = (option: string) =>
    step.type === "multi"
      ? (answers[step.id] as string[] ?? []).includes(option)
      : answers[step.id] === option;

  const handleSelect = (option: string) => {
    if (step.type === "multi") {
      const current = (answers[step.id] as string[]) ?? [];
      setAnswers((prev) => ({
        ...prev,
        [step.id]: current.includes(option)
          ? current.filter((v) => v !== option)
          : [...current, option],
      }));
    } else {
      setAnswers((prev) => ({ ...prev, [step.id]: option }));
      if (currentStep < totalSteps - 1) {
        setTimeout(() => setCurrentStep((s) => s + 1), 200);
      }
    }
  };

  const hasAnswer =
    step.type === "multi"
      ? (answers[step.id] as string[] ?? []).length > 0
      : !!answers[step.id];

  const goNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    const isTrackA = answers[1] === "네, 이미 정해졌어요";
    const isMonthly = answers[6] === "월 단위 계약";
    const lastStepId = steps[steps.length - 1].id;
    const lastAnswer = answers[lastStepId] as string;
    const durationStepId = steps.find((s) => s.type === "single" && s.id === 7)?.id;
    const durationAnswer = durationStepId ? answers[durationStepId] as string : undefined;

    const body: Record<string, unknown> = {
      jobCategoryId: jobCategoryMap[answers[2] as string],
      experienceLevelId: experienceLevelMap[answers[3] as string],
      userId: Number(localStorage.getItem("userId")),
      submissionType: isTrackA ? "TRACK_A" : "TRACK_B",
      workFormat: workFormatMap[answers[5] as string],
      amount: Number(lastAnswer),
      amountUnit: isMonthly ? "MONTHLY" : "TOTAL",
      sessionId: crypto.randomUUID(),
    };

    if (!isMonthly && durationAnswer) {
      body.duration = durationMap[durationAnswer];
    }

    try {
      await submissionAPI.submit(body);
      window.location.href = "/";
    } catch (err) {
      alert(err instanceof Error ? err.message : "서버에 연결할 수 없어요");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen w-full flex-col font-sans">
      {/* 배경 */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-login.png')" }}
        aria-hidden
      />

      {/* 탑바 */}
      <Topbar />

      {/* 콘텐츠 */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-xl">

          {/* 진행바 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-bodyfont3 mb-1">
              <span>{currentStep + 1} / {totalSteps}</span>
              <span className="text-main100">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-line1 rounded-full">
              <div
                className="h-1.5 bg-main100 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 카드 + 양옆 화살표 */}
          <div className="flex items-center gap-4">

            {/* 왼쪽 화살표 */}
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className="text-bodyfont3 hover:text-main100 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={32} />
            </button>

            {/* 질문 카드 */}
            <div className="flex-1 rounded-2xl bg-white px-8 py-8 shadow-lg">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-main25 border-t-main100" />
                  <p className="text-lg font-bold text-main100">위치 분석중...</p>
                  <p className="text-sm text-bodyfont3">User 님의 단가 위치를 확인하고 있어요</p>
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold text-main100 mb-6">{step.question}</p>

                  <div className="flex flex-col gap-3">
                    {step.options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleSelect(option)}
                        className={`w-full text-left px-5 py-3 rounded-xl border text-sm transition-all cursor-pointer ${
                          isSelected(option)
                            ? "bg-main25 border-main100 text-main100"
                            : "bg-white border-line1 text-titlefont2"
                        }`}
                      >
                        {option}
                      </button>
                    ))}

                    {step.type === "text" && (
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={(answers[step.id] as string) ?? ""}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [step.id]: e.target.value }))
                          }
                          placeholder={step.placeholder}
                          className="w-full rounded-lg border border-line1 bg-bg2 px-5 py-3 text-sm text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 focus:border-main75 focus:ring-main25 transition-all"
                        />
                        {step.hint && (
                          <p className="text-right text-xs text-bodyfont4 cursor-pointer hover:text-main100 transition-colors">
                            {step.hint}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 오른쪽 화살표 */}
            <button
              onClick={goNext}
              disabled={!hasAnswer || isLastStep || step.type === "text" || step.type === "multi"}
              className="text-bodyfont3 hover:text-main100 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={32} />
            </button>

          </div>

          {/* 다중선택 다음으로 버튼 / 텍스트 분석하기 버튼 */}
          {!isLoading && (
            <div className="flex justify-center mt-6">
              {step.type === "multi" && hasAnswer && (
                <button
                  onClick={goNext}
                  className="rounded-xl bg-gradient-to-r from-main100 to-sub175 px-8 py-3 text-sm font-semibold text-white hover:brightness-105 transition-all cursor-pointer"
                >
                  다음으로
                </button>
              )}
              {step.type === "text" && hasAnswer && isLastStep && (
                <button
                  onClick={handleSubmit}
                  className="rounded-xl bg-gradient-to-r from-main100 to-sub175 px-8 py-3 text-sm font-semibold text-white hover:brightness-105 transition-all cursor-pointer"
                >
                  분석하기
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}