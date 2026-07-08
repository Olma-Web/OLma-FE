// lib/estimate/constants.ts

export const BASE_RATE_TABLE: Record<number, Record<number, number>> = {
  14: { 1: 400000, 2: 600000, 3: 900000, 4: 1200000, 5: 1500000 },  // 웹 UI/UX
  28: { 1: 500000, 2: 700000, 3: 1000000, 4: 1300000, 5: 1600000 }, // 앱 UI/UX
};

export const WORK_SCOPE_OPTIONS = [
  { label: "기획서 100% 완료 (GUI만 작업)", multiplier: 1 },
  { label: "와이어프레임 기반 UX 고도화 + GUI", multiplier: 1.3 },
  { label: "초기 아이디어부터 UX/UI 전체 기획", multiplier: 1.8 },
] as const;

export const PLATFORM_OPTIONS = [
  { label: "모바일 앱 (iOS/Android)", multiplier: 1 },
  { label: "일반 PC 웹", multiplier: 1 },
  { label: "반응형 웹 (PC+태블릿+모바일)", multiplier: 1.5 },
] as const;

export const DELIVERABLE_OPTIONS = [
  { label: "화면 프로토타이핑", bonus: 0.1 },
  { label: "개발자용 디자인 시스템 구축", bonus: 0.2 },
  { label: "Figma 등 원본 소스 전송", bonus: 0.2 },
] as const;

export type EstimateNegotiationOption = {
  type: string;
  title: string;
  adjustedAmount: number;
  savingAmount: number;
  gapAfterAdjustment: number;
  adjustedScreenCount: number;
  uxEngagement: string;
  addons: string[];
  adjustments: string[];
  clientMessage: string;
};

export type EstimateNegotiationResult = {
  status: "NO_DISCOUNT_NEEDED" | "ADJUSTMENT_REQUIRED" | string;
  currentAmount: number;
  targetBudgetAmount: number;
  gapAmount: number;
  recommendedOptionType?: string | null;
  options: EstimateNegotiationOption[];
  clientMessage: string;
};

export type EstimateResult = {
  jobCategoryName: string;
  experienceLevelLabel: string;
  baseRatePerScreen: number;
  screenCount: number;
  step1BasicFee: number;
  uxMultiplier: number;
  workScopeLabel: string;
  step2UxFee: number;
  platformMultiplier: number;
  platformLabel: string;
  step3PlatformFee: number;
  addonPercent: number;
  step4AddonFee: number;
  addons: string[];
  finalAmount: number;
  negotiationResult?: EstimateNegotiationResult | null;
};
