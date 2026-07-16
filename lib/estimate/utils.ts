// lib/estimate/utils.ts

import {
  WORK_SCOPE_OPTIONS,
  PLATFORM_OPTIONS,
  UX_ENGAGEMENT_MAP,
  PLATFORM_ENV_MAP,
  ADDON_MAP,
  type EstimateResult,
  type SavedEstimateDetail,
} from "./constants";

export const toMan = (won: number) => Math.round(won / 10000);

export const formatEstimateDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, "0")}월 ${String(d.getDate()).padStart(2, "0")}일`;
};

// 저장된 견적서 상세를 EstimateModal이 요구하는 EstimateResult 형태로 변환한다.
// 백엔드가 내려주는 실제 finalAmount를 기준으로 역산해 반올림 오차 없이 단계별 금액을 복원한다.
export const buildEstimateResultFromDetail = (detail: SavedEstimateDetail): EstimateResult => {
  // detail.baseAmount는 총액(step1BasicFee)이 아니라 화면당 단가다.
  const step1BasicFee = detail.baseAmount * detail.screenCount;
  const step2UxFee = step1BasicFee * detail.uxMultiplier;
  const step3PlatformFee = step2UxFee * detail.platformMultiplier;
  const step4AddonFee = detail.finalAmount - step3PlatformFee;

  return {
    jobCategoryName: detail.jobCategoryName,
    experienceLevelLabel: detail.experienceLevelLabel,
    baseRatePerScreen: detail.baseAmount,
    screenCount: detail.screenCount,
    step1BasicFee,
    uxMultiplier: detail.uxMultiplier,
    workScopeLabel: WORK_SCOPE_OPTIONS.find((o) => UX_ENGAGEMENT_MAP[o.label] === detail.uxEngagement)?.label ?? "",
    step2UxFee,
    platformMultiplier: detail.platformMultiplier,
    platformLabel: PLATFORM_OPTIONS.find((o) => PLATFORM_ENV_MAP[o.label] === detail.platformEnvironment)?.label ?? "",
    step3PlatformFee,
    addonPercent: detail.addonPercent,
    step4AddonFee,
    // detail.addons는 백엔드 enum 값(예: "DESIGN_SYSTEM")이라 EstimateModal이 기대하는 한글 라벨로 되돌린다.
    addons: detail.addons.map(
      (code) => Object.keys(ADDON_MAP).find((label) => ADDON_MAP[label] === code) ?? code,
    ),
    finalAmount: detail.finalAmount,
  };
};
