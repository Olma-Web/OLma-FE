"use client";

import { Check, FileText, RefreshCw, Search, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/topbar";
import EstimateModal from "@/components/estimate/EstimateModal";
import NegotiationModal from "@/components/estimate/NegotiationModal";
import { AiAvatar, QuestionBubble, TypingBubble, AnswerPill } from "@/components/estimate/ChatPrimitives";
import { toMan } from "@/lib/estimate/utils";
import {
  BASE_RATE_TABLE,
  WORK_SCOPE_OPTIONS,
  PLATFORM_OPTIONS,
  DELIVERABLE_OPTIONS,
  JOB_CATEGORY_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  STEP_ORDER,
  QUESTION_TEXT,
  type StepId,
} from "@/lib/estimate/constants";
import { useEstimateChat } from "@/hooks/useEstimateChat";

export default function EstimatePage() {
  const router = useRouter();
  const {
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
    showReturningGreeting,
    showPreviousEstimatesPicker, setShowPreviousEstimatesPicker,
    selectedPreviousEstimate,
    selectedEstimateDetail,
    loadedEstimateBudgetAnswer,
    loadedEstimateTargetBudget, setLoadedEstimateTargetBudget,
    loadedNegotiationSaved,
    toggleDeliverable,
    advanceStep,
    restartFromStep,
    handleReset,
    answerText,
    handleSave,
    handleNegotiationSubmit,
    handleSaveWithNegotiation,
    resetNegotiation,
    resetLoadedEstimateSelection,
    resetLoadedEstimateBudgetAnswer,
    chooseLoadedEstimateBudget,
    startFreshCalculation,
    pickPreviousEstimate,
    openPreviousEstimateModal,
    handleLoadedEstimateAnalyze,
  } = useEstimateChat();

  const formatMultiplier = (multiplier: number) =>
    multiplier % 1 === 0 ? String(multiplier) : multiplier.toFixed(1);

  const optionButtonClass = (selected: boolean) =>
    `group w-full text-left px-5 py-3 rounded-xl border text-sm transition-all cursor-pointer flex justify-between items-center ${
      selected
        ? "bg-main25 border-main100 text-main100"
        : "bg-white border-line1 text-titlefont2 hover:border-main75"
    }`;

  const renderActiveControl = (stepId: StepId) => {
    switch (stepId) {
      case "job":
        return (
          <div className="flex w-[60%] gap-3">
            {JOB_CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => { setJobCategoryId(option.id); advanceStep("job"); }}
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
                onClick={() => { setExperienceLevelId(option.id); advanceStep("level"); }}
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
        return (
          <div className="flex w-full max-w-md items-center gap-2">
            <button
              type="button"
              onClick={() => setScreens(String(Math.max(1, screenCount - 1)))}
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
              onKeyDown={(e) => { if (e.key === "Enter" && canConfirm) advanceStep("screens"); }}
              placeholder="화면 수를 입력해주세요"
              className="min-w-0 flex-1 rounded-lg border border-line1 bg-bg2 px-5 py-3 text-center text-sm text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 focus:border-main75 focus:ring-main25 transition-all"
            />
            <button
              type="button"
              onClick={() => setScreens(String(screenCount + 1))}
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
                onClick={() => { setWorkScope(option.label); advanceStep("workScope"); }}
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
                onClick={() => { setPlatform(option.label); advanceStep("platform"); }}
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
                        onClick={startFreshCalculation}
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
                onEdit={() => {
                  setShowPreviousEstimatesPicker(false);
                  resetLoadedEstimateSelection();
                }}
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
                        onClick={() => pickPreviousEstimate(est)}
                        className="w-full text-left px-5 py-3 rounded-xl border border-line1 bg-white transition-all cursor-pointer flex justify-between items-center hover:border-main75"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm text-titlefont2">{est.projectName || "이름 없는 견적서"}</span>
                          <span className="mt-1 text-xs text-bodyfont4">{est.screenCount}화면</span>
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
                      startFreshCalculation();
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
                onEdit={resetLoadedEstimateSelection}
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
                    onClick={openPreviousEstimateModal}
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
                        onClick={() => chooseLoadedEstimateBudget("yes")}
                        className="flex-1 py-3 rounded-xl border border-line1 bg-white text-sm font-medium text-titlefont2 transition-all cursor-pointer hover:border-main75 hover:text-main100"
                      >
                        있어요
                      </button>
                      <button
                        onClick={() => chooseLoadedEstimateBudget("no")}
                        className="flex-1 py-3 rounded-xl border border-line1 bg-white text-sm font-medium text-titlefont2 transition-all cursor-pointer hover:border-main75 hover:text-main100"
                      >
                        아직 없어요
                      </button>
                    </div>
                  ) : (
                    <AnswerPill
                      text={loadedEstimateBudgetAnswer === "yes" ? "있어요" : "아직 없어요"}
                      onEdit={resetLoadedEstimateBudgetAnswer}
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
                      onKeyDown={(e) => { if (e.key === "Enter") handleLoadedEstimateAnalyze(); }}
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
                  onEdit={resetNegotiation}
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

            {showReturningGreeting && loadedEstimateBudgetAnswer === "no" && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <QuestionBubble fullWidth>
                  {"알겠어요! 나중에 예산이 생기면 다시 불러와서 시뮬레이터를 사용해\n보세요😊 견적서는 커리어 보관함에서 언제든지 확인할 수 있어요.\n좋은 프로젝트 되세요! 💪"}
                </QuestionBubble>
              </div>
            )}

            {showReturningGreeting &&
              (loadedEstimateBudgetAnswer === "no" || (loadedEstimateBudgetAnswer === "yes" && negotiationResult)) && (
              <div className="ml-12 flex w-full max-w-[480px] flex-col gap-3">
                <div className="flex flex-col gap-1 rounded-2xl rounded-tl-sm border border-line2 bg-gray-200 px-5 py-4 shadow-sm">
                  <p className="text-sm font-bold text-titlefont1">모든 과정이 완료되었어요!</p>
                  <p className="text-xs text-bodyfont4">견적서와 협상안은 커리어 보관함에서 확인하실 수 있어요.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push("/career?tab=estimates")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line2 bg-transparent py-2.5 text-sm font-semibold text-main100 transition hover:bg-main25 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" strokeWidth={2} />
                    보관함 보기
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line2 bg-transparent py-2.5 text-sm font-semibold text-titlefont1 transition hover:bg-gray-100 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" strokeWidth={2} />
                    새로 계산하기
                  </button>
                </div>
              </div>
            )}

            {STEP_ORDER.map((stepId, index) => {
              if (showReturningGreeting) return null;
              if (index > answeredCount) return null;
              const isActiveControl = index === answeredCount && !isTyping;

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

            {/* 계산 중 */}
            {isCalculating && answeredCount === STEP_ORDER.length && <TypingBubble />}

            {/* 계산 에러 */}
            {calcError && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <QuestionBubble>
                  {`계산 중 오류가 발생했어요. ${calcError}`}
                </QuestionBubble>
              </div>
            )}

            {/* 결과 */}
            {result && answeredCount === STEP_ORDER.length && !isTyping && !isCalculating && (
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

            {/* 협상 시뮬레이터 진입 질문 */}
            {result && answeredCount === STEP_ORDER.length && !isTyping && !isCalculating && (
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
                      onKeyDown={(e) => { if (e.key === "Enter") handleNegotiationSubmit(); }}
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
                  onEdit={resetNegotiation}
                  // "저장하기"를 눌러 백엔드에 반영된 뒤에는 수정을 막아, 중복 생성되는 것을 막는다.
                  editDisabled={negotiationSaved}
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
                <div className="flex items-start gap-3">
                  <AiAvatar />
                  <QuestionBubble fullWidth>
                    {"클라이언트와의 협상에서 좋은 결과 얻으시길 바라요!💪 가격보다\n작업 범위를 함께 조정하는 조건으로 제안하면 훨씬 설득력 있어요."}
                  </QuestionBubble>
                </div>
              </>
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
              <div className="ml-12 flex w-full max-w-[480px] flex-col gap-3">
                <div className="flex flex-col gap-1 rounded-2xl rounded-tl-sm border border-line2 bg-gray-200 px-5 py-4 shadow-sm">
                  <p className="text-sm font-bold text-titlefont1">모든 과정이 완료되었어요!</p>
                  <p className="text-xs text-bodyfont4">견적서와 협상안은 커리어 보관함에서 확인하실 수 있어요.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push("/career?tab=estimates")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line2 bg-transparent py-2.5 text-sm font-semibold text-main100 transition hover:bg-main25 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" strokeWidth={2} />
                    보관함 보기
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line2 bg-transparent py-2.5 text-sm font-semibold text-titlefont1 transition hover:bg-gray-100 cursor-pointer"
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

      {showModal && result && (
        <EstimateModal
          result={result}
          nickname=""
          onClose={() => setShowModal(false)}
          // 이전 견적서를 다시 열어본 경우(읽기 전용)에는 저장 버튼을 아예 숨긴다 — 이미 저장된 견적이다.
          initialSaved={selectedEstimateDetail ? true : estimateSaved}
          onSave={selectedEstimateDetail ? undefined : handleSave}
        />
      )}

      {negotiationModalOpen && negotiationResult && (
        <NegotiationModal
          negotiationResult={negotiationResult}
          onClose={() => setNegotiationModalOpen(false)}
          initialSaved={selectedEstimateDetail ? loadedNegotiationSaved : negotiationSaved}
          onSaveTogether={handleSaveWithNegotiation}
        />
      )}
    </div>
  );
}
