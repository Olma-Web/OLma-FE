"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw, Search, User } from "lucide-react";
import Topbar from "@/components/topbar";
import EstimateModal from "@/components/estimate/EstimateModal";
import NegotiationModal from "@/components/estimate/NegotiationModal";
import EstimateGateModal from "@/components/estimate/EstimateGateModal";
import { AiAvatar, QuestionBubble, TypingBubble, AnswerPill } from "@/components/estimate/ChatPrimitives";
import { estimateAPI, userAPI } from "@/lib/api";
import { toMan, formatEstimateDate, buildEstimateResultFromDetail } from "@/lib/estimate/utils";
import {
  BASE_RATE_TABLE,
  WORK_SCOPE_OPTIONS,
  PLATFORM_OPTIONS,
  DELIVERABLE_OPTIONS,
  JOB_CATEGORY_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  UX_ENGAGEMENT_MAP,
  PLATFORM_ENV_MAP,
  ADDON_MAP,
  STEP_ORDER,
  QUESTION_TEXT,
  TYPING_DELAY,
  type StepId,
  type WorkScopeLabel,
  type PlatformLabel,
  type DeliverableLabel,
  type EstimateResult,
  type EstimateNegotiationResult,
  type PreviousEstimateItem,
  type SavedEstimateDetail,
} from "@/lib/estimate/constants";

export default function EstimatePage() {
  const router = useRouter();
  const [jobCategoryId,     setJobCategoryId]     = useState<number | null>(null);
  const [experienceLevelId, setExperienceLevelId] = useState<number | null>(null);
  const [screens,           setScreens]           = useState("");
  const [workScope,         setWorkScope]         = useState<WorkScopeLabel | "">("");
  const [platform,          setPlatform]          = useState<PlatformLabel | "">("");
  const [deliverables,      setDeliverables]      = useState<DeliverableLabel[]>([]);
  const [showModal,         setShowModal]         = useState(false);
  const [result,            setResult]            = useState<EstimateResult | null>(null);
  const [nickname,          setNickname]          = useState("");
  const [hasSubmissions,    setHasSubmissions]    = useState<boolean | null>(null);
  const [hasClientBudget,   setHasClientBudget]   = useState<"yes" | "no" | null>(null);
  const [targetBudget,      setTargetBudget]      = useState("");
  const [negotiationStatus, setNegotiationStatus] = useState<"idle" | "loading" | "error">("idle");
  const [negotiationResult, setNegotiationResult] = useState<EstimateNegotiationResult | null>(null);
  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false);
  const [previousEstimates, setPreviousEstimates]       = useState<PreviousEstimateItem[]>([]);
  const [showReturningGreeting, setShowReturningGreeting] = useState(false);
  const [showPreviousEstimatesPicker, setShowPreviousEstimatesPicker] = useState(false);
  const [selectedPreviousEstimate, setSelectedPreviousEstimate] = useState<PreviousEstimateItem | null>(null);
  const [selectedEstimateDetail, setSelectedEstimateDetail] = useState<SavedEstimateDetail | null>(null);
  const [loadedEstimateBudgetAnswer, setLoadedEstimateBudgetAnswer] = useState<"yes" | "no" | null>(null);
  const [loadedEstimateTargetBudget, setLoadedEstimateTargetBudget] = useState("");
  const [loadedNegotiationSaved, setLoadedNegotiationSaved] = useState(false);

  // 답변이 확정된 질문 수. 답변 즉시(동기적으로) 증가해 방금 답한 말풍선이 유지되도록 하고,
  // 다음 질문의 노출만 isTyping 딜레이로 늦춘다.
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isTyping,      setIsTyping]      = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 온보딩 게이트를 타고 나갔다 돌아왔을 때 답변을 이어서 보여주기 위한 임시 저장.
  // 서버에는 아무 영향 없는 순수 클라이언트 상태 복원이다.
  const restoredDraftRef = useRef(false);
  useEffect(() => {
    const raw = sessionStorage.getItem("olma_estimate_draft");
    if (!raw) return;
    sessionStorage.removeItem("olma_estimate_draft");
    try {
      const draft = JSON.parse(raw);
      setJobCategoryId(draft.jobCategoryId);
      setExperienceLevelId(draft.experienceLevelId);
      setScreens(draft.screens);
      setWorkScope(draft.workScope);
      setPlatform(draft.platform);
      setDeliverables(draft.deliverables);
      setAnsweredCount(draft.answeredCount);
      restoredDraftRef.current = true;
    } catch {
      // 손상된 저장값은 무시한다.
    }
  }, []);

  useEffect(() => {
    const userId = Number(localStorage.getItem("userId"));
    if (!userId) return;
    userAPI.getProfile(userId).then((data) => {
      if (data?.nickname) setNickname(data.nickname);
    }).catch(() => {});
    userAPI.getSubmissions(userId).then((data) => {
      setHasSubmissions(Array.isArray(data) && data.length > 0);
    }).catch(() => {});
    estimateAPI.getList().then((data) => {
      if (!Array.isArray(data)) return;
      // 방금 답변을 복원한 세션이면 되돌아온 사용자 인사말을 띄우지 않는다.
      if (restoredDraftRef.current) return;
      // 협상 시뮬레이터를 이미 거친 견적서는 다시 불러올 필요가 없으므로 목록에서 제외한다.
      // negotiationSimulationStatus는 start/progress/complete 엔드포인트로만 갱신되는데 우리는 아직
      // 그 엔드포인트를 쓰지 않으므로, negotiationResult가 이미 있는지도 함께 확인한다.
      const notSimulated = data.filter(
        (est: PreviousEstimateItem) =>
          est.negotiationSimulationStatus !== "COMPLETED" && !est.negotiationResult,
      );
      if (notSimulated.length > 0) {
        setPreviousEstimates(notSimulated);
        setShowReturningGreeting(true);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [
    answeredCount, isTyping, hasClientBudget, result, negotiationResult, negotiationModalOpen,
    showReturningGreeting, showPreviousEstimatesPicker, selectedPreviousEstimate, loadedEstimateBudgetAnswer,
  ]);

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  const recalcAndShow = () => {
    if (!jobCategoryId || !experienceLevelId) return;

    const baseRate    = BASE_RATE_TABLE[jobCategoryId]?.[experienceLevelId] ?? 0;
    const screenCount = Number(screens);

    const step1BasicFee = screenCount * baseRate;

    const uxOption     = WORK_SCOPE_OPTIONS.find((o) => o.label === workScope);
    const uxMultiplier = uxOption?.multiplier ?? 1.0;
    const step2UxFee   = step1BasicFee * uxMultiplier;

    const platformOption     = PLATFORM_OPTIONS.find((o) => o.label === platform);
    const platformMultiplier = platformOption?.multiplier ?? 1.0;
    const step3PlatformFee   = step2UxFee * platformMultiplier;

    const addonRatioSum = deliverables.reduce((sum, d) => {
      const opt = DELIVERABLE_OPTIONS.find((o) => o.label === d);
      return sum + (opt?.bonus ?? 0);
    }, 0);
    const addonPercent  = Math.round(addonRatioSum * 100);
    const step4AddonFee = Math.round(step3PlatformFee * addonRatioSum);
    const finalAmount   = step3PlatformFee + step4AddonFee;

    const jobLabel   = JOB_CATEGORY_OPTIONS.find((o) => o.id === jobCategoryId)?.label ?? "";
    const levelLabel = EXPERIENCE_LEVEL_OPTIONS.find((o) => o.id === experienceLevelId)?.label ?? "";

    setResult({
      jobCategoryName:      jobLabel,
      experienceLevelLabel: levelLabel,
      baseRatePerScreen:    baseRate,
      screenCount,
      step1BasicFee,
      uxMultiplier,
      workScopeLabel:       workScope as string,
      step2UxFee,
      platformMultiplier,
      platformLabel:        platform as string,
      step3PlatformFee,
      addonPercent,
      step4AddonFee,
      addons:               deliverables,
      finalAmount,
    });
  };

  useEffect(() => {
    if (answeredCount === STEP_ORDER.length) {
      recalcAndShow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answeredCount]);

  const toggleDeliverable = (label: DeliverableLabel) => {
    setDeliverables((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  };

  const advanceStep = (stepId: StepId) => {
    const stepIndex = STEP_ORDER.indexOf(stepId);
    setAnsweredCount(stepIndex + 1);

    // 마지막 질문은 다음 질문이 없으므로 타이핑 딜레이 없이 바로 결과를 계산한다.
    if (stepIndex === STEP_ORDER.length - 1) return;

    if (typingTimer.current) clearTimeout(typingTimer.current);
    setIsTyping(true);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
    }, TYPING_DELAY);
  };

  const STEP_RESETTERS: Record<StepId, () => void> = {
    job:          () => setJobCategoryId(null),
    level:        () => setExperienceLevelId(null),
    screens:      () => setScreens(""),
    workScope:    () => setWorkScope(""),
    platform:     () => setPlatform(""),
    deliverables: () => setDeliverables([]),
  };

  // 답변 수정 버튼을 누르면 해당 질문부터 이후 답변을 모두 지우고 그 질문부터 다시 진행한다.
  const restartFromStep = (stepId: StepId) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    const stepIndex = STEP_ORDER.indexOf(stepId);
    STEP_ORDER.slice(stepIndex).forEach((id) => STEP_RESETTERS[id]());
    setAnsweredCount(stepIndex);
    setIsTyping(false);
    setResult(null);
    setShowModal(false);
    setHasClientBudget(null);
    setTargetBudget("");
    setNegotiationStatus("idle");
    setNegotiationResult(null);
    setNegotiationModalOpen(false);
  };

  const handleNegotiationSubmit = async () => {
    const inputMan = Number(targetBudget);
    if (!inputMan || inputMan <= 0 || negotiationStatus === "loading") return;
    if (!experienceLevelId || !jobCategoryId) return;
    setNegotiationStatus("loading");
    try {
      const data = await estimateAPI.simulateNegotiation({
        experienceLevelId,
        jobCategoryId,
        screenCount: Number(screens),
        uxEngagement: UX_ENGAGEMENT_MAP[workScope as string],
        platformEnvironment: PLATFORM_ENV_MAP[platform as string],
        addons: deliverables.map((d) => ADDON_MAP[d]),
        targetBudgetAmount: inputMan * 10000,
      });
      setNegotiationResult(data);
      setNegotiationStatus("idle");
    } catch {
      setNegotiationStatus("error");
    }
  };

  const handleLoadedEstimateAnalyze = async () => {
    const inputMan = Number(loadedEstimateTargetBudget);
    if (!inputMan || inputMan <= 0 || negotiationStatus === "loading") return;
    if (!selectedEstimateDetail) return;
    setNegotiationStatus("loading");
    try {
      const data = await estimateAPI.simulateNegotiation({
        experienceLevelId: selectedEstimateDetail.experienceLevelId,
        jobCategoryId: selectedEstimateDetail.jobCategoryId,
        screenCount: selectedEstimateDetail.screenCount,
        uxEngagement: selectedEstimateDetail.uxEngagement,
        platformEnvironment: selectedEstimateDetail.platformEnvironment,
        addons: selectedEstimateDetail.addons as ("DESIGN_SYSTEM" | "PROTOTYPING" | "SOURCE_TRANSFER")[],
        targetBudgetAmount: inputMan * 10000,
      });
      // "저장하기"를 눌러야만 기존 견적서(id)에 반영한다 — complete는 한 번 저장되면
      // 덮어쓰기가 안 되므로, 분석 단계에서 미리 저장하면 재분석 시 화면과 저장 내용이 어긋난다.
      setNegotiationResult(data);
      setNegotiationStatus("idle");
    } catch {
      setNegotiationStatus("error");
    }
  };

  const handleReset = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setJobCategoryId(null);
    setExperienceLevelId(null);
    setScreens("");
    setWorkScope("");
    setPlatform("");
    setDeliverables([]);
    setAnsweredCount(0);
    setIsTyping(false);
    setShowModal(false);
    setResult(null);
    setTargetBudget("");
    setNegotiationStatus("idle");
    setNegotiationResult(null);
    setNegotiationModalOpen(false);
    setHasClientBudget(null);
    setShowReturningGreeting(false);
    setShowPreviousEstimatesPicker(false);
    setSelectedPreviousEstimate(null);
    setSelectedEstimateDetail(null);
    setLoadedEstimateBudgetAnswer(null);
    setLoadedEstimateTargetBudget("");
    setLoadedNegotiationSaved(false);
  };

  const formatMultiplier = (multiplier: number) =>
    multiplier % 1 === 0 ? String(multiplier) : multiplier.toFixed(1);

  const optionButtonClass = (selected: boolean) =>
    `group w-full text-left px-5 py-3 rounded-xl border text-sm transition-all cursor-pointer flex justify-between items-center ${
      selected
        ? "bg-main25 border-main100 text-main100"
        : "bg-white border-line1 text-titlefont2 hover:border-main75"
    }`;

  const answerText = (stepId: StepId): string => {
    switch (stepId) {
      case "job":
        return JOB_CATEGORY_OPTIONS.find((o) => o.id === jobCategoryId)?.label ?? "";
      case "level":
        return EXPERIENCE_LEVEL_OPTIONS.find((o) => o.id === experienceLevelId)?.label ?? "";
      case "screens":
        return `${screens}장`;
      case "workScope":
        return workScope;
      case "platform":
        return platform;
      case "deliverables":
        return deliverables.length ? deliverables.join(", ") : "선택 안 함";
    }
  };

  const renderActiveControl = (stepId: StepId) => {
    switch (stepId) {
      case "job":
        return (
          <div className="flex w-[60%] gap-3">
            {JOB_CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setJobCategoryId(option.id);
                  advanceStep("job");
                }}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  jobCategoryId === option.id
                    ? "bg-main25 border-main100 text-main100"
                    : "bg-white border-line1 text-titlefont2 hover:border-main75"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        );

      case "level":
        return (
          <div className="flex w-full max-w-md flex-col gap-2">
            {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setExperienceLevelId(option.id);
                  advanceStep("level");
                }}
                className={optionButtonClass(experienceLevelId === option.id)}
              >
                <span>{option.label}</span>
                {jobCategoryId != null && (
                  <span className="text-xs text-main100 shrink-0 ml-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {(BASE_RATE_TABLE[jobCategoryId]?.[option.id] ?? 0) / 10000}만원/화면
                  </span>
                )}
              </button>
            ))}
          </div>
        );

      case "screens": {
        const screenCount = Number(screens) || 0;
        const canConfirm  = screenCount > 0;
        const decrement   = () => setScreens(String(Math.max(1, screenCount - 1)));
        const increment   = () => setScreens(String(screenCount + 1));

        return (
          <div className="flex w-full max-w-md items-center gap-2">
            <button
              type="button"
              onClick={decrement}
              disabled={screenCount <= 1}
              aria-label="화면 수 감소"
              className="h-[46px] w-[46px] shrink-0 rounded-lg border border-line1 text-lg font-semibold text-titlefont2 transition hover:border-main75 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              autoFocus
              value={screens}
              onChange={(e) => setScreens(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canConfirm) advanceStep("screens");
              }}
              placeholder="화면 수를 입력해주세요"
              className="min-w-0 flex-1 rounded-lg border border-line1 bg-bg2 px-5 py-3 text-center text-sm text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 focus:border-main75 focus:ring-main25 transition-all"
            />
            <button
              type="button"
              onClick={increment}
              aria-label="화면 수 증가"
              className="h-[46px] w-[46px] shrink-0 rounded-lg border border-line1 text-lg font-semibold text-titlefont2 transition hover:border-main75 cursor-pointer"
            >
              +
            </button>
            <button
              onClick={() => advanceStep("screens")}
              disabled={!canConfirm}
              aria-label="다음"
              className="h-[46px] w-[46px] shrink-0 rounded-lg bg-main100 text-lg font-semibold text-white transition hover:bg-main75 disabled:bg-line1 disabled:text-bodyfont4 cursor-pointer disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </div>
        );
      }

      case "workScope":
        return (
          <div className="flex w-full max-w-md flex-col gap-2">
            {WORK_SCOPE_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  setWorkScope(option.label);
                  advanceStep("workScope");
                }}
                className={optionButtonClass(workScope === option.label)}
              >
                <span>{option.label}</span>
                <span className="text-xs text-main100 shrink-0 ml-2">×{formatMultiplier(option.multiplier)}</span>
              </button>
            ))}
          </div>
        );

      case "platform":
        return (
          <div className="flex w-full max-w-md flex-col gap-2">
            {PLATFORM_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  setPlatform(option.label);
                  advanceStep("platform");
                }}
                className={optionButtonClass(platform === option.label)}
              >
                <span>{option.label}</span>
                <span className="text-xs text-main100 shrink-0 ml-2">×{formatMultiplier(option.multiplier)}</span>
              </button>
            ))}
          </div>
        );

      case "deliverables":
        return (
          <div className="flex w-full max-w-md flex-col gap-3">
            <div className="flex flex-col gap-2">
              {DELIVERABLE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => toggleDeliverable(option.label)}
                  className="group w-full text-left px-5 py-3 rounded-xl border border-line1 bg-white text-sm text-titlefont2 transition-all cursor-pointer flex justify-between items-center hover:border-main75"
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      deliverables.includes(option.label)
                        ? "border-main100 bg-main100"
                        : "border-line1"
                    }`}>
                      {deliverables.includes(option.label) && (
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      )}
                    </span>
                    {option.label}
                  </span>
                  <span className="text-xs text-main100 shrink-0 ml-2">+{option.bonus * 100}%</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => advanceStep("deliverables")}
              className="w-full rounded-xl border border-main100 bg-white py-3 text-sm font-semibold text-main100 transition-all hover:bg-main25 cursor-pointer"
            >
              견적 계산하기
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen font-sans bg-estimate">
      <Topbar />

      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-titlefont1">스마트 견적 계산기</h1>
            <p className="mt-1 text-sm text-bodyfont3">실전 프로젝트에 맞는 정확한 견적을 산출하세요.</p>
          </div>
          <button
            onClick={handleReset}
            className="mt-10 shrink-0 text-xs font-semibold text-bodyfont2 transition hover:text-main100 cursor-pointer"
          >
            ↺ 처음부터
          </button>
        </div>

        <div className="rounded-2xl bg-white px-8 py-8 shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
          <div className="flex flex-col gap-6">
            {showReturningGreeting && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <div className="flex flex-1 flex-col gap-3">
                  <QuestionBubble fullWidth>
                    {"안녕하세요! 스마트 견적 계산기에요✨ 이전에 작성하신 견적서가\n있어요. 불러와서 협상 시뮬레이터를 이어서 사용하거나, 새로 계산할 수 있어요"}
                  </QuestionBubble>
                  {!showPreviousEstimatesPicker && (
                    <div className="flex w-full max-w-[480px] gap-3">
                      <button
                        onClick={() => setShowPreviousEstimatesPicker(true)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line1 bg-white py-3 text-sm font-semibold text-titlefont2 transition hover:border-main75 hover:text-main100 cursor-pointer"
                      >
                        <User className="h-4 w-4" strokeWidth={2} />
                        이전 견적서 불러오기
                      </button>
                      <button
                        onClick={() => setShowReturningGreeting(false)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line1 bg-white py-3 text-sm font-semibold text-titlefont2 transition hover:border-main75 hover:text-main100 cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" strokeWidth={2} />
                        새로 계산하기
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showReturningGreeting && showPreviousEstimatesPicker && (
              <AnswerPill
                text="이전 견적서 불러오기"
                onEdit={() => setShowPreviousEstimatesPicker(false)}
                editDisabled={false}
              />
            )}

            {showReturningGreeting && showPreviousEstimatesPicker && !selectedPreviousEstimate && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <div className="flex flex-1 flex-col gap-3">
                  <QuestionBubble fullWidth>어떤 견적서를 불러올까요?</QuestionBubble>
                  <div className="flex w-full max-w-[480px] flex-col gap-2">
                    {previousEstimates.map((est) => (
                      <button
                        key={est.id}
                        onClick={() => {
                          setSelectedPreviousEstimate(est);
                          estimateAPI.getById(est.id).then(setSelectedEstimateDetail).catch(() => {});
                        }}
                        className="w-full text-left px-5 py-3 rounded-xl border border-line1 bg-white transition-all cursor-pointer flex justify-between items-center hover:border-main75"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm text-titlefont2">{est.projectName || "이름 없는 견적서"}</span>
                          <span className="mt-1 text-xs text-bodyfont4">
                            {est.screenCount}화면 · {formatEstimateDate(est.createdAt)}
                          </span>
                        </div>
                        <span className="text-base font-semibold text-main100 shrink-0 ml-2">
                          {toMan(est.finalAmount).toLocaleString()}만 원
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setShowPreviousEstimatesPicker(false);
                      setShowReturningGreeting(false);
                    }}
                    className="flex w-full max-w-[480px] items-center justify-center gap-1.5 text-sm font-semibold text-titlefont1 transition hover:text-main100 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" strokeWidth={2} />
                    새로 계산하기
                  </button>
                </div>
              </div>
            )}

            {showReturningGreeting && selectedPreviousEstimate && (
              <AnswerPill
                text={selectedPreviousEstimate.projectName || "이름 없는 견적서"}
                onEdit={() => {
                  setSelectedPreviousEstimate(null);
                  setSelectedEstimateDetail(null);
                }}
                editDisabled={false}
              />
            )}

            {showReturningGreeting && selectedPreviousEstimate && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <div className="flex flex-1 flex-col gap-3">
                  <QuestionBubble fullWidth>
                    {`${selectedPreviousEstimate.projectName || "이름 없는 견적서"}을 불러왔어요! 화면 수: ${selectedPreviousEstimate.screenCount}화면, 권장 견적: ${toMan(selectedPreviousEstimate.finalAmount).toLocaleString()}만원\n견적서를 열어보고, 협상 시뮬레이터도 사용할 수 있어요`}
                  </QuestionBubble>
                  <button
                    onClick={() => {
                      if (!selectedEstimateDetail) return;
                      setResult(buildEstimateResultFromDetail(selectedEstimateDetail));
                      setShowModal(true);
                    }}
                    disabled={!selectedEstimateDetail}
                    className="w-full max-w-[480px] rounded-xl bg-main100 py-3 text-sm font-semibold text-white transition hover:bg-main75 disabled:bg-line1 disabled:text-bodyfont4 cursor-pointer disabled:cursor-not-allowed"
                  >
                    견적서 열어보기
                  </button>
                </div>
              </div>
            )}

            {showReturningGreeting && selectedPreviousEstimate && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <div className="flex flex-1 flex-col gap-3">
                  <QuestionBubble fullWidth>
                    {"클라이언트가 제안한 예산이 생기셨나요?🤔\n협상 시뮬레이터로 조정 가능한 방안을 분석해드릴게요."}
                  </QuestionBubble>
                  {loadedEstimateBudgetAnswer === null ? (
                    <div className="flex w-full max-w-md gap-3">
                      <button
                        onClick={() => setLoadedEstimateBudgetAnswer("yes")}
                        className="flex-1 py-3 rounded-xl border border-line1 bg-white text-sm font-medium text-titlefont2 transition-all cursor-pointer hover:border-main75 hover:text-main100"
                      >
                        있어요
                      </button>
                      <button
                        onClick={() => setLoadedEstimateBudgetAnswer("no")}
                        className="flex-1 py-3 rounded-xl border border-line1 bg-white text-sm font-medium text-titlefont2 transition-all cursor-pointer hover:border-main75 hover:text-main100"
                      >
                        아직 없어요
                      </button>
                    </div>
                  ) : (
                    <AnswerPill
                      text={loadedEstimateBudgetAnswer === "yes" ? "있어요" : "아직 없어요"}
                      onEdit={() => {
                        setLoadedEstimateBudgetAnswer(null);
                        setLoadedEstimateTargetBudget("");
                        setLoadedNegotiationSaved(false);
                      }}
                      editDisabled={false}
                    />
                  )}
                </div>
              </div>
            )}

            {showReturningGreeting && loadedEstimateBudgetAnswer === "yes" && !negotiationResult && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <div className="flex flex-1 flex-col gap-3">
                  <QuestionBubble fullWidth>
                    {"클라이언트가 제안한 금액을 만원 단위로 입력해주세요!\n협상 가능한 범위를 분석해드릴게요🔍"}
                  </QuestionBubble>
                  <div className="flex w-full max-w-md gap-2">
                    <input
                      type="number"
                      min="1"
                      autoFocus
                      value={loadedEstimateTargetBudget}
                      onChange={(e) => setLoadedEstimateTargetBudget(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleLoadedEstimateAnalyze();
                      }}
                      placeholder="예: 300"
                      className="min-w-0 flex-1 rounded-lg border border-line1 bg-bg2 px-5 py-3 text-sm text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 focus:border-main75 focus:ring-main25 transition-all"
                    />
                    <button
                      onClick={handleLoadedEstimateAnalyze}
                      disabled={!Number(loadedEstimateTargetBudget) || negotiationStatus === "loading" || !selectedEstimateDetail}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-main100 px-5 py-3 text-sm font-semibold text-white transition hover:bg-main75 disabled:bg-line1 disabled:text-bodyfont4 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Search className="h-4 w-4" strokeWidth={2} />
                      {negotiationStatus === "loading" ? "분석 중..." : "분석하기"}
                    </button>
                  </div>
                  {negotiationStatus === "error" && (
                    <p className="text-xs text-red-500">협상안을 생성하지 못했어요. 다시 시도해주세요.</p>
                  )}
                </div>
              </div>
            )}

            {showReturningGreeting && loadedEstimateBudgetAnswer === "yes" && negotiationResult && (
              <>
                <AnswerPill
                  text={`${loadedEstimateTargetBudget}만 원`}
                  onEdit={() => {
                    setNegotiationResult(null);
                    setNegotiationStatus("idle");
                    setNegotiationModalOpen(false);
                  }}
                  // "저장하기"를 눌러 백엔드에 반영된 뒤에는, complete가 덮어쓰기를 지원하지 않으므로 수정을 막는다.
                  editDisabled={loadedNegotiationSaved}
                />
                <div className="flex items-start gap-3">
                  <AiAvatar />
                  <div className="flex flex-1 flex-col gap-3">
                    <QuestionBubble fullWidth>
                      {`분석 완료!💡 클라이언트 예산(${loadedEstimateTargetBudget}만원) 기준 협상 시나리오\n${negotiationResult.options.length}가지를 준비했어요. 저장하면 기존 견적서와 함께 커리어 보관함에\n저장돼요.`}
                    </QuestionBubble>
                    <button
                      onClick={() => setNegotiationModalOpen(true)}
                      className="w-full max-w-[480px] rounded-xl bg-main100 py-3 text-sm font-semibold text-white transition hover:bg-main75 cursor-pointer"
                    >
                      협상안 열어보기
                    </button>
                  </div>
                </div>
              </>
            )}

            {showReturningGreeting && loadedEstimateBudgetAnswer === "yes" && negotiationResult && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <QuestionBubble fullWidth>
                  {"클라이언트와의 협상에서 좋은 결과 얻으시길 바라요!💪 가격보다\n작업 범위를 함께 조정하는 조건으로 제안하면 훨씬 설득력 있어요."}
                </QuestionBubble>
              </div>
            )}

            {showReturningGreeting && loadedEstimateBudgetAnswer === "yes" && negotiationResult && (
              <div className="ml-12 flex flex-col gap-3">
                <div className="w-full max-w-[480px] rounded-2xl rounded-tl-sm border border-line2 bg-gray-200 px-5 py-4 shadow-sm">
                  <p className="text-sm font-bold text-titlefont1">모든 과정이 완료되었어요!</p>
                </div>
                <div className="flex w-full max-w-[480px] gap-3">
                  <button
                    onClick={() => router.push("/career?tab=estimates")}
                    className="flex-1 rounded-xl border border-line1 bg-white py-3 text-sm font-semibold text-titlefont2 transition hover:border-main75 hover:text-main100 cursor-pointer"
                  >
                    보관함 보기
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line1 bg-white py-3 text-sm font-semibold text-titlefont2 transition hover:border-main75 hover:text-main100 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" strokeWidth={2} />
                    새로 계산하기
                  </button>
                </div>
              </div>
            )}

            {showReturningGreeting && loadedEstimateBudgetAnswer === "no" && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <QuestionBubble fullWidth>
                  {"알겠어요! 나중에 예산이 생기면 다시 불러와서 시뮬레이터를 사용해\n보세요😊 견적서는 커리어 보관함에서 언제든지 확인할 수 있어요.\n좋은 프로젝트 되세요! 💪"}
                </QuestionBubble>
              </div>
            )}

            {showReturningGreeting && loadedEstimateBudgetAnswer === "no" && (
              <div className="ml-12 flex w-full max-w-[480px] items-center justify-between rounded-2xl rounded-tl-sm border border-line2 bg-gray-200 px-5 py-4 shadow-sm">
                <p className="text-sm font-bold text-titlefont1">모든 과정이 완료되었어요!</p>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-sm font-medium text-titlefont2 transition hover:text-main100 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" strokeWidth={2} />
                  새로 계산하기
                </button>
              </div>
            )}

            {STEP_ORDER.map((stepId, index) => {
              if (index > answeredCount) return null;

              const isActiveControl = index === answeredCount && !isTyping && !showReturningGreeting;

              if (isActiveControl) {
                return (
                  <div key={stepId} className="flex items-start gap-3">
                    <AiAvatar />
                    <div className="flex flex-1 flex-col gap-3">
                      <QuestionBubble>{QUESTION_TEXT[stepId]}</QuestionBubble>
                      {renderActiveControl(stepId)}
                    </div>
                  </div>
                );
              }

              if (index < answeredCount) {
                return (
                  <div key={stepId} className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <AiAvatar />
                      <QuestionBubble>{QUESTION_TEXT[stepId]}</QuestionBubble>
                    </div>
                    <AnswerPill
                      text={answerText(stepId)}
                      onEdit={() => restartFromStep(stepId)}
                      editDisabled={isTyping}
                    />
                  </div>
                );
              }

              return null;
            })}

            {isTyping && <TypingBubble />}

            {result && answeredCount === STEP_ORDER.length && !isTyping && hasSubmissions !== false && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <div className="flex flex-1 flex-col gap-3">
                  <QuestionBubble fullWidth>
                    {`견적서가 완성되었어요! 권장 최소 방어 견적은 ${toMan(result.finalAmount).toLocaleString()}만 원이에요.`}
                  </QuestionBubble>
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full max-w-md rounded-xl bg-main100 py-3 text-sm font-semibold text-white transition hover:bg-main75 cursor-pointer"
                  >
                    견적서 열어보기
                  </button>
                </div>
              </div>
            )}

            {result && answeredCount === STEP_ORDER.length && !isTyping && hasSubmissions !== false && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <div className="flex flex-1 flex-col gap-3">
                  <QuestionBubble fullWidth>
                    {"혹시 클라이언트가 먼저 예산을 제안한 금액이 있으신가요?🤔\n있다면 협상 시뮬레이터로 대안을 분석해드릴게요"}
                  </QuestionBubble>
                  {hasClientBudget === null ? (
                    <div className="flex w-full max-w-md gap-3">
                      <button
                        onClick={() => setHasClientBudget("yes")}
                        className="flex-1 py-3 rounded-xl border border-line1 bg-white text-sm font-medium text-titlefont2 transition-all cursor-pointer hover:border-main75 hover:text-main100"
                      >
                        있어요
                      </button>
                      <button
                        onClick={() => setHasClientBudget("no")}
                        className="flex-1 py-3 rounded-xl border border-line1 bg-white text-sm font-medium text-titlefont2 transition-all cursor-pointer hover:border-main75 hover:text-main100"
                      >
                        아직 없어요
                      </button>
                    </div>
                  ) : (
                    <AnswerPill
                      text={hasClientBudget === "yes" ? "있어요" : "아직 없어요"}
                      onEdit={() => {
                        setHasClientBudget(null);
                        setTargetBudget("");
                        setNegotiationStatus("idle");
                        setNegotiationResult(null);
                        setNegotiationModalOpen(false);
                      }}
                      editDisabled={false}
                    />
                  )}
                </div>
              </div>
            )}

            {hasClientBudget === "yes" && !negotiationResult && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <div className="flex flex-1 flex-col gap-3">
                  <QuestionBubble fullWidth>
                    {"클라이언트가 제안한 금액을 만원 단위로 입력해주세요!\n협상 가능한 범위를 분석해드릴게요🔍"}
                  </QuestionBubble>
                  <div className="flex w-full max-w-md gap-2">
                    <input
                      type="number"
                      min="1"
                      autoFocus
                      value={targetBudget}
                      onChange={(e) => setTargetBudget(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNegotiationSubmit();
                      }}
                      placeholder="예: 300"
                      className="min-w-0 flex-1 rounded-lg border border-line1 bg-bg2 px-5 py-3 text-sm text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 focus:border-main75 focus:ring-main25 transition-all"
                    />
                    <button
                      onClick={handleNegotiationSubmit}
                      disabled={!Number(targetBudget) || negotiationStatus === "loading"}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-main100 px-5 py-3 text-sm font-semibold text-white transition hover:bg-main75 disabled:bg-line1 disabled:text-bodyfont4 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Search className="h-4 w-4" strokeWidth={2} />
                      {negotiationStatus === "loading" ? "분석 중..." : "분석하기"}
                    </button>
                  </div>
                  {negotiationStatus === "error" && (
                    <p className="text-xs text-red-500">협상안을 생성하지 못했어요. 다시 시도해주세요.</p>
                  )}
                </div>
              </div>
            )}

            {hasClientBudget === "yes" && negotiationResult && (
              <>
                <AnswerPill
                  text={`${targetBudget}만 원`}
                  onEdit={() => {
                    setNegotiationResult(null);
                    setNegotiationStatus("idle");
                    setNegotiationModalOpen(false);
                  }}
                  editDisabled={false}
                />
                <div className="flex items-start gap-3">
                  <AiAvatar />
                  <div className="flex flex-1 flex-col gap-3">
                    <QuestionBubble fullWidth>
                      {`분석 완료!💡 클라이언트 예산(${targetBudget}만원) 기준 협상 시나리오\n${negotiationResult.options.length}가지를 준비했어요. 저장하면 기존 견적서와 함께 커리어 보관함에\n저장돼요.`}
                    </QuestionBubble>
                    <button
                      onClick={() => setNegotiationModalOpen(true)}
                      className="w-full max-w-[480px] rounded-xl bg-main100 py-3 text-sm font-semibold text-white transition hover:bg-main75 cursor-pointer"
                    >
                      협상안 열어보기
                    </button>
                  </div>
                </div>
              </>
            )}

            {hasClientBudget === "yes" && negotiationResult && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <QuestionBubble fullWidth>
                  {"클라이언트와의 협상에서 좋은 결과 얻으시길 바라요!💪 가격보다\n작업 범위를 함께 조정하는 조건으로 제안하면 훨씬 설득력 있어요."}
                </QuestionBubble>
              </div>
            )}

            {hasClientBudget === "no" && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <QuestionBubble fullWidth>
                  {"알겠어요! 나중에 예산이 생기면 다시 불러와서 시뮬레이터를 사용해\n보세요😊 견적서는 커리어 보관함에서 언제든지 확인할 수 있어요.\n좋은 프로젝트 되세요! 💪"}
                </QuestionBubble>
              </div>
            )}

            {(hasClientBudget === "no" || (hasClientBudget === "yes" && negotiationResult)) && (
              <div className="ml-12 flex flex-col gap-3">
                <div className="animate-chat-in w-full max-w-[480px] rounded-2xl rounded-tl-sm border border-line2 bg-bg2 px-5 py-4 shadow-sm">
                  <p className="text-base font-bold text-titlefont1">모든 과정이 완료되었어요!</p>
                  <p className="mt-1 text-sm text-bodyfont1">견적서와 협상안은 커리어 보관함에서 확인하실 수 있어요.</p>
                </div>
                <div className="flex w-full max-w-[480px] gap-3">
                  <button
                    onClick={() => router.push("/career?tab=estimates")}
                    className="flex-1 rounded-xl border border-line1 bg-white py-3 text-sm font-semibold text-titlefont2 transition hover:border-main75 hover:text-main100 cursor-pointer"
                  >
                    보관함 보기
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line1 bg-white py-3 text-sm font-semibold text-titlefont2 transition hover:border-main75 hover:text-main100 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" strokeWidth={2} />
                    새로 계산하기
                  </button>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {result && answeredCount === STEP_ORDER.length && !isTyping && hasSubmissions === false && (
        <EstimateGateModal
          nickname={nickname}
          onShare={() => {
            sessionStorage.setItem("olma_estimate_draft", JSON.stringify({
              jobCategoryId, experienceLevelId, screens, workScope, platform, deliverables, answeredCount,
            }));
            router.push("/onboarding?returnTo=estimate");
          }}
          onDismiss={() => {
            setResult(null);
            setAnsweredCount(STEP_ORDER.length - 1);
          }}
        />
      )}

      {showModal && result && (
        <EstimateModal
          result={result}
          nickname={nickname}
          onClose={() => setShowModal(false)}
          // 이전 견적서를 다시 열어본 경우(selectedEstimateDetail 존재)는 이미 저장된 견적이라
          // 저장 버튼을 아예 숨긴다 — 안 그러면 estimateAPI.save()가 중복 견적을 새로 만든다.
          onSave={
            selectedEstimateDetail
              ? undefined
              : (name) =>
                  estimateAPI.save({
                    experienceLevelId: experienceLevelId!,
                    jobCategoryId: jobCategoryId!,
                    screenCount: Number(screens),
                    uxEngagement: UX_ENGAGEMENT_MAP[workScope as string],
                    platformEnvironment: PLATFORM_ENV_MAP[platform as string],
                    addons: deliverables.map((d) => ADDON_MAP[d]),
                    projectName: name,
                    negotiationTargetBudgetAmount: negotiationResult?.targetBudgetAmount,
                  })
          }
        />
      )}

      {negotiationModalOpen && negotiationResult && (
        <NegotiationModal
          negotiationResult={negotiationResult}
          onClose={() => setNegotiationModalOpen(false)}
          onSaveTogether={async () => {
            // 로드된 견적서는 "저장하기"를 누른 시점에 비로소 기존 견적서(id)를 start/complete로 갱신한다.
            // (complete는 한 번 저장되면 덮어쓰기가 안 되므로 저장 전까지는 분석만 하고 저장을 미룬다.)
            if (selectedEstimateDetail) {
              await estimateAPI.startNegotiationSimulation(selectedEstimateDetail.id);
              await estimateAPI.completeNegotiationSimulation(selectedEstimateDetail.id, negotiationResult);
              setLoadedNegotiationSaved(true);
            } else {
              await estimateAPI.save({
                experienceLevelId: experienceLevelId!,
                jobCategoryId: jobCategoryId!,
                screenCount: Number(screens),
                uxEngagement: UX_ENGAGEMENT_MAP[workScope as string],
                platformEnvironment: PLATFORM_ENV_MAP[platform as string],
                addons: deliverables.map((d) => ADDON_MAP[d]),
                negotiationTargetBudgetAmount: negotiationResult.targetBudgetAmount,
              });
            }
          }}
        />
      )}

    </div>
  );
}
