"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { estimateAPI, draftAPI } from "@/lib/api";
import { toMan } from "@/lib/estimate/utils";
import {
  JOB_CATEGORY_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  UX_ENGAGEMENT_MAP,
  PLATFORM_ENV_MAP,
  ADDON_MAP,
  STEP_ORDER,
  TYPING_DELAY,
  type StepId,
  type WorkScopeLabel,
  type PlatformLabel,
  type DeliverableLabel,
} from "@/lib/estimate/constants";

export type EstimateCalculateResponse = {
  savedEstimateId:   number | null;
  projectName:       string | null;
  experienceLevelLabel: string;
  jobCategoryName:   string;
  baseDailyRate:     number;
  screenCount:       number;
  step1BasicFee:     number;
  uxMultiplier:      number;
  step2UxFee:        number;
  platformMultiplier: number;
  step3PlatformFee:  number;
  addons:            string[];
  addonPercent:      number;
  step4AddonFee:     number;
  finalAmount:       number;
  negotiationResult: EstimateNegotiationResult | null;
  createdAt:         string | null;
};

export type EstimateNegotiationOption = {
  type:                 string;
  title:                string;
  adjustedAmount:       number;
  savingAmount:         number;
  gapAfterAdjustment:   number;
  adjustedScreenCount:  number;
  uxEngagement:         string;
  addons:               string[];
  adjustments:          string[];
  clientMessage:        string;
};

export type EstimateNegotiationResult = {
  status:                string;
  currentAmount:         number;
  targetBudgetAmount:    number;
  gapAmount:             number;
  recommendedOptionType: string;
  options:               EstimateNegotiationOption[];
  clientMessage:         string;
};

// GET /v1/estimates 목록 항목 — 백엔드 SavedEstimateResponse와 동일한 모양이지만
// 이 화면(피커)에 필요한 필드만 골라 쓴다.
export interface PreviousEstimateItem {
  id:        number;
  projectName?: string;
  createdAt: string;
  finalAmount: number;
  screenCount: number;
  negotiationSimulationStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  negotiationResult?: EstimateNegotiationResult | null;
}

// GET /v1/estimates/{id} 상세 응답. step1~4 단계별 금액은 내려주지 않으므로
// baseAmount(화면당 단가)를 기준으로 EstimateCalculateResponse 모양으로 역산해 복원한다.
export interface SavedEstimateDetail {
  id: number;
  projectName?: string | null;
  experienceLevelId: number;
  experienceLevelLabel: string;
  jobCategoryId: number;
  jobCategoryName: string;
  baseAmount: number;
  screenCount: number;
  uxEngagement: "GUI_ONLY" | "WIREFRAME_PLUS" | "FULL_PLANNING";
  uxMultiplier: number;
  platformEnvironment: "MOBILE_APP" | "PC_WEB" | "RESPONSIVE_WEB";
  platformMultiplier: number;
  addons: string[];
  addonPercent: number;
  finalAmount: number;
  createdAt: string;
  negotiationSimulationStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  negotiationSimulationStarted?: boolean;
  // 분석까지 마쳤으면 EstimateNegotiationResult 모양, "아직 없어요"만 눌렀으면
  // { declined: true }, start만 하고 아무 답도 안 남겼으면 빈 객체({})로 내려올 수 있다.
  negotiationSimulationState?: (Partial<EstimateNegotiationResult> & { declined?: boolean }) | null;
  negotiationSimulationUpdatedAt?: string | null;
  negotiationResult?: EstimateNegotiationResult | null;
}

// 협상 진행 상태를 "최근 것"으로 보고 자동 이어하기를 적용할 기준 시간.
const RESUME_STALE_MS = 60 * 60 * 1000; // 1시간

// PATCH /v1/users/me/drafts/ESTIMATE 에 저장하는 진행 중인 6단계 질문 상태.
interface EstimateDraftState {
  jobCategoryId: number | null;
  experienceLevelId: number | null;
  screens: string;
  workScope: string;
  platform: string;
  deliverables: string[];
  answeredCount: number;
}

const buildResultFromDetail = (detail: SavedEstimateDetail): EstimateCalculateResponse => {
  const step1BasicFee   = detail.baseAmount * detail.screenCount;
  const step2UxFee      = step1BasicFee * detail.uxMultiplier;
  const step3PlatformFee = step2UxFee * detail.platformMultiplier;
  const step4AddonFee   = detail.finalAmount - step3PlatformFee;

  return {
    savedEstimateId:      detail.id,
    projectName:          detail.projectName ?? null,
    experienceLevelLabel: detail.experienceLevelLabel,
    jobCategoryName:      detail.jobCategoryName,
    baseDailyRate:        detail.baseAmount,
    screenCount:          detail.screenCount,
    step1BasicFee,
    uxMultiplier:         detail.uxMultiplier,
    step2UxFee,
    platformMultiplier:   detail.platformMultiplier,
    step3PlatformFee,
    addons:               detail.addons,
    addonPercent:         detail.addonPercent,
    step4AddonFee,
    finalAmount:          detail.finalAmount,
    negotiationResult:    detail.negotiationResult ?? null,
    createdAt:            detail.createdAt,
  };
};

export function useEstimateChat() {
  const [jobCategoryId,     setJobCategoryId]     = useState<number | null>(null);
  const [experienceLevelId, setExperienceLevelId] = useState<number | null>(null);
  const [screens,           setScreens]           = useState("");
  const [workScope,         setWorkScope]         = useState<WorkScopeLabel | "">("");
  const [platform,          setPlatform]          = useState<PlatformLabel | "">("");
  const [deliverables,      setDeliverables]      = useState<DeliverableLabel[]>([]);
  const [showModal,         setShowModal]         = useState(false);
  const [result,            setResult]            = useState<EstimateCalculateResponse | null>(null);
  const [estimateSaved,     setEstimateSaved]     = useState(false);
  const [answeredCount,     setAnsweredCount]     = useState(0);
  const [isTyping,          setIsTyping]          = useState(false);
  const [isCalculating,     setIsCalculating]     = useState(false);
  const [calcError,         setCalcError]         = useState<string | null>(null);

  // ── 협상 시뮬레이터 ───────────────────────────────────
  const [hasClientBudget,     setHasClientBudget]     = useState<"yes" | "no" | null>(null);
  const [targetBudget,        setTargetBudget]        = useState("");
  const [negotiationStatus,   setNegotiationStatus]   = useState<"idle" | "loading" | "error">("idle");
  const [negotiationResult,   setNegotiationResult]   = useState<EstimateNegotiationResult | null>(null);
  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false);
  const [negotiationSaved,    setNegotiationSaved]    = useState(false);

  // ── 이전 견적서 불러오기 ─────────────────────────────
  const [previousEstimates,          setPreviousEstimates]          = useState<PreviousEstimateItem[]>([]);
  const [showReturningGreeting,      setShowReturningGreeting]      = useState(false);
  const [showPreviousEstimatesPicker, setShowPreviousEstimatesPicker] = useState(false);
  const [selectedPreviousEstimate,   setSelectedPreviousEstimate]   = useState<PreviousEstimateItem | null>(null);
  const [selectedEstimateDetail,     setSelectedEstimateDetail]     = useState<SavedEstimateDetail | null>(null);
  const [loadedEstimateBudgetAnswer, setLoadedEstimateBudgetAnswer] = useState<"yes" | "no" | null>(null);
  const [loadedEstimateTargetBudget, setLoadedEstimateTargetBudget] = useState("");
  const [loadedNegotiationSaved,     setLoadedNegotiationSaved]     = useState(false);

  // 새로고침해도 진행 중이던 6단계 질문을 이어서 볼 수 있도록 draft API로 저장/복원한다.
  // 복원이 끝나기 전에 저장 effect가 먼저 실행되면, 아직 반영 안 된 초기값(빈 답변)을
  // "진행 상태 없음"으로 오판해 방금 복원한 draft를 지워버릴 수 있다 — draftRestored를
  // state로 두어, 복원이 실제로 반영된 다음 렌더부터만 저장 effect가 동작하도록 막는다.
  const [draftRestored, setDraftRestored] = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [answeredCount, isTyping, result]);

  useEffect(() => {
    return () => { if (typingTimer.current) clearTimeout(typingTimer.current); };
  }, []);

  // "이전 견적서 불러오기" 인사말이 뜰 상황(불러올 수 있는 저장된 견적서가 있을 때)이면
  // 그게 먼저고, draft 복원은 이전 견적서가 없거나 사용자가 "새로 계산하기"를 골랐을
  // 때만 실행한다 — 안 그러면 인사말이 떠 있는 동안에도 draft가 조용히 복원되면서
  // answeredCount가 6으로 차 있는 경우 뒤에서 calculate()까지 돌아버릴 수 있다.
  const draftRestoreAttemptedRef = useRef(false);
  // 실제로 진행 중이던(answeredCount > 0) draft를 찾아 복원했으면 true를 반환한다 —
  // 마운트 시 이 값으로 "이전 견적서 인사말을 보여줄지"를 결정한다. 답변을 이미 시작한
  // draft가 있다는 것 자체가 "새로 계산하기를 이미 골랐었다"는 뜻이라, 인사말보다 우선한다.
  const restoreDraft = useCallback(async (): Promise<boolean> => {
    if (draftRestoreAttemptedRef.current) return false;
    draftRestoreAttemptedRef.current = true;
    try {
      const draft = await draftAPI.get<Partial<EstimateDraftState>>("ESTIMATE");
      if (draft?.status === "IN_PROGRESS" && draft.state && (draft.state.answeredCount ?? 0) > 0) {
        const s = draft.state;
        if (s.jobCategoryId != null)     setJobCategoryId(s.jobCategoryId);
        if (s.experienceLevelId != null) setExperienceLevelId(s.experienceLevelId);
        if (s.screens != null)           setScreens(s.screens);
        if (s.workScope != null)         setWorkScope(s.workScope as WorkScopeLabel);
        if (s.platform != null)          setPlatform(s.platform as PlatformLabel);
        if (s.deliverables != null)      setDeliverables(s.deliverables as DeliverableLabel[]);
        if (s.answeredCount != null)     setAnsweredCount(s.answeredCount);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setDraftRestored(true);
    }
  }, []);

  // 답변이 확정되어 answeredCount가 바뀔 때만 저장한다 — screens 입력 등 키 입력마다
  // 쏘면 API 낭비라, "다음"/Enter로 스텝을 넘긴 시점의 값만 draft에 반영한다.
  useEffect(() => {
    if (!draftRestored || answeredCount === 0) return;
    draftAPI.save<EstimateDraftState>("ESTIMATE", {
      jobCategoryId, experienceLevelId, screens, workScope, platform, deliverables, answeredCount,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftRestored, answeredCount]);

  // 이전에 저장해둔 견적서가 있으면(협상 시뮬레이터를 아직 안 거친 것만) 목록을 새로 받아와
  // "불러올지 새로 계산할지" 물어본다. 마운트 시 한 번뿐 아니라, 견적을 새로 저장하거나
  // 협상을 완료한 뒤 리셋할 때도 다시 불러야 방금 생긴/완료된 견적서가 반영된다.
  const refreshPreviousEstimates = useCallback(async () => {
    try {
      const data = await estimateAPI.getList();
      if (!Array.isArray(data)) return [];
      const notSimulated = data.filter(
        (est: PreviousEstimateItem) =>
          est.negotiationSimulationStatus !== "COMPLETED" && !est.negotiationResult,
      );
      setPreviousEstimates(notSimulated);
      return notSimulated;
    } catch {
      return [];
    }
  }, []);

  // 협상 시뮬레이터를 진행하다 만 견적서가 있으면(analyze만 하고 저장은 안 한 상태),
  // 새로고침해도 백엔드에 기록해둔 진행 상태(negotiationSimulationState)를 그대로 불러와
  // 목록 선택 없이 바로 이어서 보여준다.
  //
  // 취소 API가 없어서 한 번이라도 "있어요/없어요"를 눌렀던 견적서는 계속 IN_PROGRESS로
  // 남는다. 그래서 마지막으로 답한 지 오래된(RESUME_STALE_MS 이상) 견적서는 자동으로
  // 이어서 보여주지 않고 그냥 목록에 남겨둔다 — 다시 고르면 예산 질문부터 새로 답하게 된다.
  const resumeInProgressNegotiation = useCallback(async (candidates: PreviousEstimateItem[]) => {
    const inProgress = candidates.find((est) => est.negotiationSimulationStatus === "IN_PROGRESS");
    if (!inProgress) return false;
    try {
      const detail: SavedEstimateDetail = await estimateAPI.getById(inProgress.id);
      const updatedAt = detail.negotiationSimulationUpdatedAt
        ? new Date(detail.negotiationSimulationUpdatedAt).getTime()
        : 0;
      const state = detail.negotiationSimulationState;
      if (!updatedAt || Date.now() - updatedAt > RESUME_STALE_MS || state?.declined) {
        return false;
      }
      setSelectedPreviousEstimate(inProgress);
      setSelectedEstimateDetail(detail);
      // negotiationSimulationState는 진행 단계에 따라 모양이 다르다:
      // 분석까지 마쳤으면 실제 EstimateNegotiationResult(options 배열 포함),
      // "아직 없어요"를 눌렀으면 { declined: true }, start만 하고 아무 답도 안 남겼으면
      // 빈 객체({})로 내려올 수 있다 — negotiationSimulationStatus만 보고 무조건
      // "있어요"로 되돌리면 안 되고, 이 state를 우선해서 실제로 무엇을 남겼는지 확인해야 한다.
      if (state && Array.isArray(state.options)) {
        setNegotiationResult(state as EstimateNegotiationResult);
        setLoadedEstimateTargetBudget(String(toMan(state.targetBudgetAmount ?? 0)));
        setLoadedEstimateBudgetAnswer("yes");
      } else if (detail.negotiationSimulationStatus === "IN_PROGRESS") {
        // "있어요"를 눌렀던 시점(=IN_PROGRESS로 표시된 시점)부터는 분석 전이라도
        // 예산 입력 단계로 바로 돌아가야 처음 질문부터 다시 답할 필요가 없다.
        setLoadedEstimateBudgetAnswer("yes");
      }
      setShowReturningGreeting(true);
      setShowPreviousEstimatesPicker(true);
      return true;
    } catch {
      // 조회 실패 시 아래 일반 목록 로직으로 폴백한다.
      return false;
    }
  }, []);

  useEffect(() => {
    refreshPreviousEstimates().then(async (notSimulated) => {
      // 답변을 이미 시작한 draft가 있다면(=예전에 "새로 계산하기"를 골라 진행 중이던 것)
      // 이전 견적서의 IN_PROGRESS 기록보다 우선해 바로 그 자리로 돌아간다.
      if (await restoreDraft()) return;
      if (await resumeInProgressNegotiation(notSimulated)) return;
      // 진행 중인 새 계산 draft나 실제 협상 분석 상태가 없을 때만 인사말을 보여준다.
      if (notSimulated.length > 0) {
        setShowReturningGreeting(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 인사말에서 "새로 계산하기"를 골랐을 때 — 마운트 시 draft를 이미 확인했었지만(진행 상태가
  // 없어서 인사말이 떴던 것), 방어적으로 한 번 더 시도한다. ref 가드가 있어 중복 호출은 no-op이다.
  const startFreshCalculation = () => {
    setShowReturningGreeting(false);
    restoreDraft();
  };

  const pickPreviousEstimate = (item: PreviousEstimateItem) => {
    setSelectedPreviousEstimate(item);
    estimateAPI.getById(item.id).then(setSelectedEstimateDetail).catch(() => {});
  };

  const openPreviousEstimateModal = () => {
    if (!selectedEstimateDetail) return;
    setResult(buildResultFromDetail(selectedEstimateDetail));
    setShowModal(true);
  };

  // "예산 있으신가요?" 답변 — 고른 시점에 바로 negotiation-simulation을 IN_PROGRESS로
  // 표시해두고, 어느 쪽을 골랐는지도 항상 { declined } 마커로 함께 기록한다. "있어요"만
  // 기록하고 "없어요"를 안 남기면(또는 그 반대) 예전 답변이 백엔드에 그대로 남아있다가,
  // 나중에 마음이 바뀌어 반대로 눌러도 새로고침 시 옛 답변으로 되돌아간다 — 취소 API가
  // 따로 없어서, 매번 최신 답변으로 덮어써야 한다.
  const chooseLoadedEstimateBudget = (answer: "yes" | "no") => {
    setLoadedEstimateBudgetAnswer(answer);
    if (!selectedEstimateDetail) return;

    const started = selectedEstimateDetail.negotiationSimulationStarted
      ? Promise.resolve()
      : estimateAPI.startNegotiationSimulation(selectedEstimateDetail.id).then(() => {
          setSelectedEstimateDetail((prev) => (prev ? { ...prev, negotiationSimulationStarted: true } : prev));
        });

    started
      .then(() => estimateAPI.progressNegotiationSimulation(
        selectedEstimateDetail.id,
        { declined: answer === "no" },
      ))
      .catch(() => {});
  };

  // ── 백엔드 계산 ───────────────────────────────────────
  const calculate = useCallback(async () => {
    if (!jobCategoryId || !experienceLevelId || !workScope || !platform) return;
    setIsCalculating(true);
    setCalcError(null);
    try {
      const data = await estimateAPI.calculate({
        experienceLevelId,
        jobCategoryId,
        screenCount:         Number(screens),
        uxEngagement:        UX_ENGAGEMENT_MAP[workScope],
        platformEnvironment: PLATFORM_ENV_MAP[platform],
        addons: deliverables.map((d) => ADDON_MAP[d]).filter(Boolean),
      });
      setResult(data);
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : "계산에 실패했어요.");
    } finally {
      setIsCalculating(false);
    }
  }, [jobCategoryId, experienceLevelId, screens, workScope, platform, deliverables]);

  useEffect(() => {
    if (answeredCount === STEP_ORDER.length) calculate();
  }, [answeredCount, calculate]);

  // ── 협상 시뮬레이션 ───────────────────────────────────
  const simulateNegotiation = useCallback(async (targetBudget: number) => {
    if (!jobCategoryId || !experienceLevelId || !workScope || !platform) return null;
    try {
      return await estimateAPI.simulateNegotiation({
        experienceLevelId,
        jobCategoryId,
        screenCount:         Number(screens),
        uxEngagement:        UX_ENGAGEMENT_MAP[workScope],
        platformEnvironment: PLATFORM_ENV_MAP[platform],
        addons: deliverables.map((d) => ADDON_MAP[d]).filter(Boolean),
        targetBudgetAmount:  targetBudget,
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error("협상 시뮬레이션에 실패했어요.");
    }
  }, [jobCategoryId, experienceLevelId, screens, workScope, platform, deliverables]);

  const handleNegotiationSubmit = async () => {
    const inputMan = Number(targetBudget);
    if (!inputMan || inputMan <= 0 || negotiationStatus === "loading") return;
    setNegotiationStatus("loading");
    try {
      const data = await simulateNegotiation(inputMan * 10000);
      setNegotiationResult(data);
      setNegotiationStatus("idle");
    } catch {
      setNegotiationStatus("error");
    }
  };

  // 불러온 이전 견적서 기준으로 분석한다 — 지금 6단계 질문 답변이 아니라
  // selectedEstimateDetail의 값을 그대로 써야 한다.
  const handleLoadedEstimateAnalyze = async () => {
    const inputMan = Number(loadedEstimateTargetBudget);
    if (!inputMan || inputMan <= 0 || negotiationStatus === "loading" || !selectedEstimateDetail) return;
    setNegotiationStatus("loading");
    try {
      const data = await estimateAPI.simulateNegotiation({
        experienceLevelId:   selectedEstimateDetail.experienceLevelId,
        jobCategoryId:       selectedEstimateDetail.jobCategoryId,
        screenCount:         selectedEstimateDetail.screenCount,
        uxEngagement:        selectedEstimateDetail.uxEngagement,
        platformEnvironment: selectedEstimateDetail.platformEnvironment,
        addons:              selectedEstimateDetail.addons as ("DESIGN_SYSTEM" | "PROTOTYPING" | "SOURCE_TRANSFER")[],
        targetBudgetAmount:  inputMan * 10000,
      });
      // "저장하기"를 눌러야만 complete로 최종 확정한다 — complete는 한 번 저장되면 덮어쓰기가
      // 안 되므로, 분석 단계에서는 progress에만 기록해 재분석 시 화면과 저장 내용이 어긋나지
      // 않게 한다. 새로고침해도 이 진행 상태를 백엔드에서 그대로 불러올 수 있도록 best-effort로
      // 기록한다 (실패해도 분석 결과 화면 표시는 막지 않는다).
      try {
        if (!selectedEstimateDetail.negotiationSimulationStarted) {
          await estimateAPI.startNegotiationSimulation(selectedEstimateDetail.id);
          setSelectedEstimateDetail((prev) => (prev ? { ...prev, negotiationSimulationStarted: true } : prev));
        }
        await estimateAPI.progressNegotiationSimulation(selectedEstimateDetail.id, data);
      } catch {
        // 진행 상태 저장 실패는 분석 결과 표시를 막지 않는다.
      }
      setNegotiationResult(data);
      setNegotiationStatus("idle");
    } catch {
      setNegotiationStatus("error");
    }
  };

  // 협상 분석 결과의 "답변 수정" — 분석 결과를 지워 금액을 다시 입력할 수 있게 한다.
  const resetNegotiation = () => {
    setNegotiationResult(null);
    setNegotiationStatus("idle");
    setNegotiationModalOpen(false);
  };

  // 이전 견적서 불러오기 흐름 중 "답변 수정" — negotiationResult를 같이 안 지우면, 다시
  // "있어요"를 눌렀을 때 새로 입력하지도 않은 이전 분석 결과 화면으로 곧장 튀어버린다.
  // 그래서 이 흐름을 되돌릴 때는 항상 협상 상태도 함께 초기화한다.

  // 견적서를 다른 걸로 다시 고르는 경우 — 예산 답변까지 전부 지운다.
  const resetLoadedEstimateSelection = () => {
    setSelectedPreviousEstimate(null);
    setSelectedEstimateDetail(null);
    setLoadedEstimateBudgetAnswer(null);
    setLoadedEstimateTargetBudget("");
    setLoadedNegotiationSaved(false);
    resetNegotiation();
  };

  // 같은 견적서는 유지한 채 "예산 있어요/없어요" 답변만 다시 고르는 경우.
  const resetLoadedEstimateBudgetAnswer = () => {
    setLoadedEstimateBudgetAnswer(null);
    setLoadedEstimateTargetBudget("");
    setLoadedNegotiationSaved(false);
    resetNegotiation();
  };

  // ── 저장 ─────────────────────────────────────────────
  const handleSave = async (projectName?: string, negotiationTargetBudgetAmount?: number) => {
    if (!experienceLevelId || !jobCategoryId || !workScope || !platform) {
      throw new Error("필수 입력 값이 누락되었습니다.");
    }
    await estimateAPI.save({
      experienceLevelId,
      jobCategoryId,
      screenCount:         Number(screens),
      uxEngagement:        UX_ENGAGEMENT_MAP[workScope],
      platformEnvironment: PLATFORM_ENV_MAP[platform],
      addons: deliverables.map((d) => ADDON_MAP[d]).filter(Boolean),
      projectName:         projectName || undefined,
      negotiationTargetBudgetAmount,
    });
    setEstimateSaved(true);
    // 견적서가 진짜로 저장됐으니, 새로고침 복원용으로 남겨뒀던 draft는 더 이상 필요 없다.
    draftAPI.delete("ESTIMATE").catch(() => {});
  };

  // 협상안 모달의 "견적서와 함께 저장하기".
  // - 불러온 이전 견적서(selectedEstimateDetail)라면 이미 id가 있으므로
  //   start(필요시)+complete로 그 견적서에 협상 결과를 기록한다.
  // - 새로 계산한 견적서라면 아직 id가 없으므로 negotiationTargetBudgetAmount를 함께 실어
  //   estimateAPI.save 한 번으로 견적서+협상 목표 금액을 같이 생성한다.
  const handleSaveWithNegotiation = async () => {
    if (!negotiationResult) return;
    if (selectedEstimateDetail) {
      if (!selectedEstimateDetail.negotiationSimulationStarted) {
        await estimateAPI.startNegotiationSimulation(selectedEstimateDetail.id);
      }
      await estimateAPI.completeNegotiationSimulation(selectedEstimateDetail.id, negotiationResult);
      setLoadedNegotiationSaved(true);
    } else {
      await handleSave(undefined, negotiationResult.targetBudgetAmount);
      setNegotiationSaved(true);
    }
  };

  // ── 챗봇 흐름 제어 ───────────────────────────────────
  const toggleDeliverable = (label: DeliverableLabel) => {
    setDeliverables((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  };

  const advanceStep = (stepId: StepId) => {
    const stepIndex = STEP_ORDER.indexOf(stepId);
    setAnsweredCount(stepIndex + 1);
    if (stepIndex === STEP_ORDER.length - 1) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setIsTyping(true);
    typingTimer.current = setTimeout(() => setIsTyping(false), TYPING_DELAY);
  };

  const STEP_RESETTERS: Record<StepId, () => void> = {
    job:          () => setJobCategoryId(null),
    level:        () => setExperienceLevelId(null),
    screens:      () => setScreens(""),
    workScope:    () => setWorkScope(""),
    platform:     () => setPlatform(""),
    deliverables: () => setDeliverables([]),
  };

  const restartFromStep = (stepId: StepId) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    const stepIndex = STEP_ORDER.indexOf(stepId);
    STEP_ORDER.slice(stepIndex).forEach((id) => STEP_RESETTERS[id]());
    setAnsweredCount(stepIndex);
    setIsTyping(false);
    setResult(null);
    setShowModal(false);
    setEstimateSaved(false);
    setCalcError(null);
    setHasClientBudget(null);
    setTargetBudget("");
    setNegotiationStatus("idle");
    setNegotiationResult(null);
    setNegotiationModalOpen(false);
    setNegotiationSaved(false);
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
    setEstimateSaved(false);
    setCalcError(null);
    setHasClientBudget(null);
    setTargetBudget("");
    setNegotiationStatus("idle");
    setNegotiationResult(null);
    setNegotiationModalOpen(false);
    setNegotiationSaved(false);
    // 처음부터 다시 시작하는 것이므로, 쓰다 만 draft가 남아있었다면 지운다.
    draftAPI.delete("ESTIMATE").catch(() => {});
    // 불러올 수 있는(아직 협상 시뮬레이터를 안 거친) 이전 견적서가 남아있으면, 리셋 후에도
    // "이전 견적서 불러오기 / 새로 계산하기" 선택 화면으로 돌아가야 한다. mount 시점에
    // 받아둔 목록은 방금 새로 저장했거나 막 협상을 완료한 견적서를 반영하지 못하므로
    // 여기서 다시 받아온다.
    // 조회가 끝나기 전에 false로 먼저 바꿔버리면, 그 사이 사용자가 6단계 질문에 답을
    // 시작해도 조회가 끝나는 순간 true로 덮어써서 인사말이 답변 화면을 가려버린다 —
    // 그래서 중간값 없이 조회 결과로 한 번에 확정한다.
    refreshPreviousEstimates().then((notSimulated) => {
      setShowReturningGreeting(notSimulated.length > 0);
    });
    setShowPreviousEstimatesPicker(false);
    setSelectedPreviousEstimate(null);
    setSelectedEstimateDetail(null);
    setLoadedEstimateBudgetAnswer(null);
    setLoadedEstimateTargetBudget("");
    setLoadedNegotiationSaved(false);
  };

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

  return {
    // 상태
    jobCategoryId,     setJobCategoryId,
    experienceLevelId, setExperienceLevelId,
    screens,           setScreens,
    workScope,         setWorkScope,
    platform,          setPlatform,
    deliverables,
    showModal,         setShowModal,
    result,
    estimateSaved,
    answeredCount,
    isTyping,
    isCalculating,
    calcError,
    bottomRef,
    hasClientBudget,     setHasClientBudget,
    targetBudget,        setTargetBudget,
    negotiationStatus,
    negotiationResult,
    negotiationModalOpen, setNegotiationModalOpen,
    negotiationSaved,
    previousEstimates,
    showReturningGreeting,      setShowReturningGreeting,
    showPreviousEstimatesPicker, setShowPreviousEstimatesPicker,
    selectedPreviousEstimate,   setSelectedPreviousEstimate,
    selectedEstimateDetail,     setSelectedEstimateDetail,
    loadedEstimateBudgetAnswer, setLoadedEstimateBudgetAnswer,
    loadedEstimateTargetBudget, setLoadedEstimateTargetBudget,
    loadedNegotiationSaved,
    // 핸들러
    toggleDeliverable,
    advanceStep,
    restartFromStep,
    handleReset,
    answerText,
    handleSave,
    simulateNegotiation,
    handleNegotiationSubmit,
    handleSaveWithNegotiation,
    resetNegotiation,
    resetLoadedEstimateSelection,
    resetLoadedEstimateBudgetAnswer,
    startFreshCalculation,
    chooseLoadedEstimateBudget,
    pickPreviousEstimate,
    openPreviousEstimateModal,
    handleLoadedEstimateAnalyze,
  };
}
