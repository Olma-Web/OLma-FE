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

export type WorkScopeLabel   = typeof WORK_SCOPE_OPTIONS[number]["label"];
export type PlatformLabel    = typeof PLATFORM_OPTIONS[number]["label"];
export type DeliverableLabel = typeof DELIVERABLE_OPTIONS[number]["label"];

export const JOB_CATEGORY_OPTIONS = [
  { id: 14, label: "웹 UI/UX" },
  { id: 28, label: "앱 UI/UX" },
];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { id: 1, label: "1년 미만" },
  { id: 2, label: "1~3년 차 (주니어)" },
  { id: 3, label: "4~6년 차 (미들)" },
  { id: 4, label: "7~9년 차 (시니어)" },
  { id: 5, label: "10년 차 이상 (리더)" },
];

export const UX_ENGAGEMENT_MAP: Record<string, "GUI_ONLY" | "WIREFRAME_PLUS" | "FULL_PLANNING"> = {
  "기획서 100% 완료 (GUI만 작업)":      "GUI_ONLY",
  "와이어프레임 기반 UX 고도화 + GUI":  "WIREFRAME_PLUS",
  "초기 아이디어부터 UX/UI 전체 기획":  "FULL_PLANNING",
};

export const PLATFORM_ENV_MAP: Record<string, "MOBILE_APP" | "PC_WEB" | "RESPONSIVE_WEB"> = {
  "모바일 앱 (iOS/Android)":      "MOBILE_APP",
  "일반 PC 웹":                   "PC_WEB",
  "반응형 웹 (PC+태블릿+모바일)": "RESPONSIVE_WEB",
};

export const ADDON_MAP: Record<string, "DESIGN_SYSTEM" | "PROTOTYPING" | "SOURCE_TRANSFER"> = {
  "화면 프로토타이핑":           "PROTOTYPING",
  "개발자용 디자인 시스템 구축": "DESIGN_SYSTEM",
  "Figma 등 원본 소스 전송":    "SOURCE_TRANSFER",
};

export type StepId = "job" | "level" | "screens" | "workScope" | "platform" | "deliverables";

export const STEP_ORDER: StepId[] = ["job", "level", "screens", "workScope", "platform", "deliverables"];

export const QUESTION_TEXT: Record<StepId, string> = {
  job:          "안녕하세요! 스마트 견적 계산기에요.\n어떤 디자인 업무를 주로 하시나요?",
  level:        "실무 경력은 어느 정도 되셨나요?",
  screens:      "대략적인 총 작업 화면(핵심 메인 화면 기준) 수는 몇 장인가요?",
  workScope:    "이번 프로젝트, 어디서부터 작업하시나요?",
  platform:     "어떤 환경에 맞춰 디자인하시나요?",
  deliverables: "클라이언트에게 어떤 것까지 넘겨주시나요? 해당 항목을 모두 선택 후 '견적 계산하기'를 눌러주세요. (없으면 바로 눌러도 돼요)",
};

export const TYPING_DELAY = 650;

export interface PreviousEstimateItem {
  id: number;
  projectName?: string;
  createdAt: string;
  finalAmount: number;
  screenCount: number;
  negotiationSimulationStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  negotiationResult?: unknown;
}

export interface SavedEstimateDetail {
  id: number;
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
}
