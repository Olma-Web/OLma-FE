"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getSteps } from "@/lib/onboarding/steps";
import { jobCategoryMap, experienceLevelMap, workFormatMap, durationMap, certificateMap } from "@/lib/onboarding/maps";
import { submissionAPI, userAPI } from "@/lib/api";
import Topbar from "@/components/topbar";
import { ChevronLeft, ChevronRight } from "lucide-react";

function OnboardingContent() {
  const searchParams = useSearchParams();
  const isSpecUpdate = searchParams.get("mode") === "spec-update";

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [specUpdateAnswers, setSpecUpdateAnswers] = useState<Record<number, string | string[]>>({});

  const allSteps = getSteps(answers[1] as string, answers[6] as string);
  const steps = isSpecUpdate ? allSteps.filter((s) => [2, 3, 4].includes(s.id)) : allSteps;
  const totalSteps = steps.length;
  const step = steps[currentStep];

  const workingAnswers = isSpecUpdate ? specUpdateAnswers : answers;
  const progressDenominator = isSpecUpdate ? 3 : (answers[1] && !answers[6]
    ? getSteps(answers[1] as string, "건별 외주 계약").length
    : totalSteps);
  const progress = Math.round(((currentStep + 1) / progressDenominator) * 100);
  const isLastStep = currentStep === totalSteps - 1;

  const isSelected = (option: string) =>
    step.type === "multi"
      ? (workingAnswers[step.id] as string[] ?? []).includes(option)
      : workingAnswers[step.id] === option;

  const handleSelect = (option: string) => {
    if (step.type === "multi") {
      const current = (workingAnswers[step.id] as string[]) ?? [];
      let next: string[];
      if (option === "없음") {
        next = current.includes("없음") ? [] : ["없음"];
      } else {
        const withoutNone = current.filter((v) => v !== "없음");
        next = withoutNone.includes(option)
          ? withoutNone.filter((v) => v !== option)
          : [...withoutNone, option];
      }
      if (isSpecUpdate) {
        setSpecUpdateAnswers((prev) => ({ ...prev, [step.id]: next }));
      } else {
        setAnswers((prev) => ({ ...prev, [step.id]: next }));
      }
    } else {
      const newAnswers = { ...workingAnswers, [step.id]: option };
      if (isSpecUpdate) {
        setSpecUpdateAnswers(newAnswers as Record<number, string | string[]>);
      } else {
        setAnswers(newAnswers as Record<number, string | string[]>);
      }
      if (!isSpecUpdate) {
        const newSteps = getSteps(newAnswers[1] as string, newAnswers[6] as string);
        if (currentStep < newSteps.length - 1) {
          setTimeout(() => setCurrentStep((s) => s + 1), 200);
        }
      } else {
        if (currentStep < totalSteps - 1) {
          setTimeout(() => setCurrentStep((s) => s + 1), 200);
        }
      }
    }
  };

  const hasAnswer =
    step.type === "multi"
      ? (workingAnswers[step.id] as string[] ?? []).length > 0
      : !!workingAnswers[step.id];

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else if (isLastStep) {
      // 마지막 스텝에서 "다음으로" 버튼 클릭 시 제출
      handleSubmit();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const userId = Number(localStorage.getItem("userId"));

      if (isSpecUpdate) {
        // Spec update mode: 프로필 업데이트만
        if (userId) {
          const selectedCerts = (specUpdateAnswers[4] as string[] ?? [])
            .filter((c) => c !== "없음")
            .map((c) => certificateMap[c])
            .filter(Boolean) as number[];

          await userAPI.updateProfile(userId, {
            jobCategoryId: jobCategoryMap[specUpdateAnswers[2] as string],
            experienceLevelId: experienceLevelMap[specUpdateAnswers[3] as string],
            certificateTypeIds: selectedCerts,
          });
        }
        // 스펙 업데이트 완료 후 바로 커리어 페이지로 이동 (자동으로 데이터 새로고침됨)
        window.location.href = "/career";
      } else {
        // Normal onboarding mode: submission + profile 업데이트
        const isTrackA = answers[1] === "네, 이미 정해졌어요";
        const isMonthly = answers[6] === "월 단위 계약";
        const lastStepId = allSteps[allSteps.length - 1].id;
        const lastAnswer = answers[lastStepId] as string;
        const durationStepId = allSteps.find((s) => s.type === "single" && s.id === 7)?.id;
        const durationAnswer = durationStepId ? answers[durationStepId] as string : undefined;

        const body: Record<string, unknown> = {
          jobCategoryId: jobCategoryMap[answers[2] as string],
          experienceLevelId: experienceLevelMap[answers[3] as string],
          userId: userId,
          submissionType: isTrackA ? "TRACK_A" : "TRACK_B",
          workFormat: workFormatMap[answers[5] as string],
          amount: Number(lastAnswer),
          amountUnit: isMonthly ? "MONTHLY" : "TOTAL",
          sessionId: crypto.randomUUID(),
        };

        if (!isMonthly && durationAnswer) {
          body.duration = durationMap[durationAnswer];
        }

        const result = await submissionAPI.submit(body);

        // submission 후 user profile에 jobCategory/experienceLevel 저장
        if (userId) {
          const selectedCerts = (answers[4] as string[] ?? [])
            .filter((c) => c !== "없음")
            .map((c) => certificateMap[c])
            .filter(Boolean) as number[];

          await userAPI.updateProfile(userId, {
            jobCategoryId: jobCategoryMap[answers[2] as string],
            experienceLevelId: experienceLevelMap[answers[3] as string],
            certificateTypeIds: selectedCerts,
          });
        }

        window.location.href = "/dashboard";
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "서버에 연결할 수 없어요");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1500);
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
        <div className="w-full max-w-[761px]">

          {/* 진행바 */}
          <div className="mb-6 px-12">
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

          {/* 질문 카드 */}
          <div className="flex items-center gap-4">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className="text-bodyfont3 hover:text-main100 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={32} />
            </button>

            <div className="flex-1 rounded-2xl bg-white px-[38px] py-[38px] shadow-lg">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-main25 border-t-main100" />
                  <p className="text-xl font-bold text-main100">위치 분석중...</p>
                  <p className="text-base text-bodyfont3">{localStorage.getItem("nickname") ?? "User"} 님의 단가 위치를 확인하고 있어요</p>
                </div>
              ) : (
                <>
                  <p className={`text-2xl font-semibold text-main100 ${step.type === "multi" || step.description ? "mb-2" : "mb-6"}`}>
                    {step.question}
                  </p>
                  {step.type === "multi" && (
                    <p className="text-xs text-bodyfont4 mb-4">해당하는 항목을 모두 선택하세요</p>
                  )}
                  {step.description && (
                    <p className="text-sm text-black mb-[18px]">{step.description}</p>
                  )}

                  <div className="flex flex-col gap-3">
                    {step.options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleSelect(option)}
                        className={`w-full text-left px-5 py-3.5 rounded-xl border text-base transition-all cursor-pointer ${
                          isSelected(option)
                            ? "bg-main25 border-main100 text-main100"
                            : "bg-white border-line1 text-titlefont2"
                        }`}
                      >
                        {option}
                      </button>
                    ))}

                    {step.type === "text" && (
                      <div className="flex flex-col gap-[4.4px]">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={(answers[step.id] as string) ?? ""}
                            onChange={(e) =>
                              setAnswers((prev) => ({ ...prev, [step.id]: e.target.value }))
                            }
                            placeholder={step.placeholder}
                            className="flex-1 rounded-lg border border-line1 bg-bg2 px-4 py-3.5 text-base text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 focus:border-main75 focus:ring-main25 transition-all"
                          />
                          <span className="text-base text-titlefont2">만 원</span>
                        </div>
                        {step.hint && (
                          <p
                            onClick={handleSkip}
                            className="text-right text-sm text-bodyfont4 cursor-pointer hover:text-main100 transition-colors"
                          >
                            {step.hint}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={goNext}
              disabled={!(step.type === "single" && hasAnswer && !isLastStep)}
              className="text-bodyfont3 hover:text-main100 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={32} />
            </button>

          </div>

          {/* 하단 버튼 영역 */}
          {!isLoading && step.type === "multi" && hasAnswer && (
            <div className="flex justify-center mt-6">
              <button
                onClick={goNext}
                className="rounded-xl bg-gradient-to-r from-main100 to-sub175 px-[42px] py-3.5 text-base font-semibold text-white hover:brightness-105 transition-all cursor-pointer"
              >
                {isSpecUpdate ? "저장하기" : "다음으로"}
              </button>
            </div>
          )}

          {!isLoading && step.type === "text" && hasAnswer && isLastStep && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSubmit}
                className="rounded-xl bg-gradient-to-r from-main100 to-sub175 px-[42px] py-3.5 text-base font-semibold text-white hover:brightness-105 transition-all cursor-pointer"
              >
                분석하기
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>로딩 중...</p></div>}>
      <OnboardingContent />
    </Suspense>
  );
}