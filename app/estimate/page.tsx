"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/topbar";
import EstimateModal from "@/components/estimate/EstimateModal";
import { estimateAPI, userAPI } from "@/lib/api";
import {
  BASE_RATE_TABLE,
  WORK_SCOPE_OPTIONS,
  PLATFORM_OPTIONS,
  DELIVERABLE_OPTIONS,
  type EstimateResult,
} from "@/lib/estimate/constants";

type WorkScopeLabel   = typeof WORK_SCOPE_OPTIONS[number]["label"];
type PlatformLabel    = typeof PLATFORM_OPTIONS[number]["label"];
type DeliverableLabel = typeof DELIVERABLE_OPTIONS[number]["label"];

const UX_ENGAGEMENT_MAP: Record<string, "GUI_ONLY" | "WIREFRAME_PLUS" | "FULL_PLANNING"> = {
  "기획서 100% 완료 (GUI만 작업)":      "GUI_ONLY",
  "와이어프레임 기반 UX 고도화 + GUI":  "WIREFRAME_PLUS",
  "초기 아이디어부터 UX/UI 전체 기획":  "FULL_PLANNING",
};

const PLATFORM_ENV_MAP: Record<string, "MOBILE_APP" | "PC_WEB" | "RESPONSIVE_WEB"> = {
  "모바일 앱 (iOS/Android)":      "MOBILE_APP",
  "일반 PC 웹":                   "PC_WEB",
  "반응형 웹 (PC+태블릿+모바일)": "RESPONSIVE_WEB",
};

const ADDON_MAP: Record<string, "DESIGN_SYSTEM" | "PROTOTYPING" | "SOURCE_TRANSFER"> = {
  "화면 프로토타이핑":           "PROTOTYPING",
  "개발자용 디자인 시스템 구축": "DESIGN_SYSTEM",
  "Figma 등 원본 소스 전송":    "SOURCE_TRANSFER",
};

const JOB_CATEGORY_OPTIONS = [
  { id: 14, label: "웹 UI/UX" },
  { id: 28, label: "앱 UI/UX" },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { id: 1, label: "1년 미만" },
  { id: 2, label: "1~3년 차 (주니어)" },
  { id: 3, label: "4~6년 차 (미들)" },
  { id: 4, label: "7~9년 차 (시니어)" },
  { id: 5, label: "10년 차 이상 (리더)" },
];

export default function EstimatePage() {
  const [jobCategoryId,     setJobCategoryId]     = useState<number | null>(null);
  const [experienceLevelId, setExperienceLevelId] = useState<number | null>(null);
  const [screens,           setScreens]           = useState("");
  const [workScope,         setWorkScope]         = useState<WorkScopeLabel | "">("");
  const [platform,          setPlatform]          = useState<PlatformLabel | "">("");
  const [deliverables,      setDeliverables]      = useState<DeliverableLabel[]>([]);
  const [showModal,         setShowModal]         = useState(false);
  const [result,            setResult]            = useState<EstimateResult | null>(null);
  const [nickname,          setNickname]          = useState("");

  useEffect(() => {
    const userId = Number(localStorage.getItem("userId"));
    if (!userId) return;
    userAPI.getProfile(userId).then((data) => {
      if (data?.nickname) setNickname(data.nickname);
    }).catch(() => {});
  }, []);

  const toggleDeliverable = (label: DeliverableLabel) => {
    setDeliverables((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  };

  const isActive =
    jobCategoryId !== null &&
    experienceLevelId !== null &&
    Number(screens) > 0 &&
    workScope !== "" &&
    platform !== "";

  const handleCalculate = () => {
    if (!isActive || !jobCategoryId || !experienceLevelId) return;

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
    setShowModal(true);
  };

  const optionClass = (selected: boolean) =>
    `w-full text-left px-5 py-3 rounded-xl border text-sm transition-all cursor-pointer flex justify-between items-center ${
      selected
        ? "bg-main25 border-main100 text-main100"
        : "bg-white border-line1 text-titlefont2"
    }`;

  return (
    <div className="min-h-screen font-sans bg-estimate">
      <Topbar />

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-titlefont1">스마트 견적 계산기</h1>
          <p className="mt-1 text-sm text-bodyfont3">실전 프로젝트에 맞는 정확한 견적을 산출하세요.</p>
        </div>

        <div className="rounded-2xl bg-white px-8 py-8 shadow-[0_8px_32px_rgba(0,0,0,0.10)] flex flex-col gap-8">

          {/* Q1: 직군 */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-titlefont1">1. 어떤 직군으로 작업하시나요?</p>
            <div className="flex gap-3">
              {JOB_CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setJobCategoryId(option.id)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    jobCategoryId === option.id
                      ? "bg-main25 border-main100 text-main100"
                      : "bg-white border-line1 text-titlefont2"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: 연차 */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-titlefont1">2. 현재 연차가 어떻게 되시나요?</p>
            <div className="flex flex-col gap-2">
              {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setExperienceLevelId(option.id)}
                  className={optionClass(experienceLevelId === option.id)}
                >
                  <span>{option.label}</span>
                  {experienceLevelId === option.id && jobCategoryId != null && (
                    <span className="text-xs text-bodyfont3 shrink-0 ml-2">
                      {(BASE_RATE_TABLE[jobCategoryId]?.[option.id] ?? 0) / 10000}만원/화면
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Q3: 화면 수 */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-titlefont1">
              3. 대략적인 총 작업 화면(핵심 메인 화면 기준) 수는 몇 장인가요?
            </p>
            <input
              type="number"
              min="1"
              value={screens}
              onChange={(e) => setScreens(e.target.value)}
              placeholder="화면 수를 입력해주세요"
              className="w-full rounded-lg border border-line1 bg-bg2 px-5 py-3 text-sm text-titlefont2 placeholder:text-bodyfont4 focus:outline-none focus:ring-2 focus:border-main75 focus:ring-main25 transition-all"
            />
          </div>

          {/* Q4: UX 기획 관여도 */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-titlefont1">
              4. 이번 프로젝트, 어디서부터 작업하시나요?
            </p>
            <div className="flex flex-col gap-2">
              {WORK_SCOPE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setWorkScope(option.label)}
                  className={optionClass(workScope === option.label)}
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-bodyfont3 shrink-0 ml-2">×{option.multiplier.toFixed(1)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Q5: 플랫폼 환경 */}
          <div className="flex flex-col gap-3">
            <p className="font-medium text-titlefont1">
              5. 어떤 환경에 맞춰 디자인하시나요?
            </p>
            <div className="flex flex-col gap-2">
              {PLATFORM_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setPlatform(option.label)}
                  className={optionClass(platform === option.label)}
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-bodyfont3 shrink-0 ml-2">×{option.multiplier.toFixed(1)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Q6: 산출물 */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-medium text-titlefont1">
                6. 클라이언트에게 어떤 것까지 넘겨주시나요?
              </p>
              <p className="text-xs text-bodyfont3 mt-0.5">중복 선택 가능</p>
            </div>
            <div className="flex flex-col gap-2">
              {DELIVERABLE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => toggleDeliverable(option.label)}
                  className={optionClass(deliverables.includes(option.label))}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      deliverables.includes(option.label)
                        ? "border-main100 bg-main100"
                        : "border-line1"
                    }`}>
                      {deliverables.includes(option.label) && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                    {option.label}
                  </span>
                  <span className="text-xs text-bodyfont3 shrink-0 ml-2">+{option.bonus * 100}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* 계산 버튼 */}
          <button
            onClick={handleCalculate}
            disabled={!isActive}
            className={`w-full rounded-xl py-4 text-sm font-semibold text-white transition-all ${
              isActive
                ? "bg-gradient-to-r from-main100 to-sub175 hover:brightness-105 cursor-pointer"
                : "bg-line1 text-bodyfont4 cursor-not-allowed"
            }`}
          >
            견적 계산하기
          </button>
        </div>
      </div>

      {showModal && result && (
        <EstimateModal
          result={result}
          nickname={nickname}
          onClose={() => setShowModal(false)}
          projectName={projectName}
          onProjectNameChange={setProjectName}
          onSave={(name) =>
            estimateAPI.save({
              experienceLevelId: experienceLevelId!,
              jobCategoryId: jobCategoryId!,
              screenCount: Number(screens),
              uxEngagement: UX_ENGAGEMENT_MAP[workScope as string],
              platformEnvironment: PLATFORM_ENV_MAP[platform as string],
              addons: deliverables.map((d) => ADDON_MAP[d]),
              projectName: name,
            })
          }
        />
      )}
    </div>
  );
}