// lib/estimate/constants.ts

export const BASE_PRICE_PER_SCREEN = 100;

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
  { label: "개발자용 디자인 시스템 구축", bonus: 0.2 },
  { label: "화면 프로토타이핑", bonus: 0.1 },
  { label: "Figma 등 원본 소스 전송", bonus: 0.2 },
] as const;

export const MOCK_SPEC = {
  jobCategory: "웹 UI/UX",
  experienceLevel: "4~6년차(미들)",
};