export type StepType = "single" | "multi" | "text";

export interface Step {
  id: number;
  question: string;
  type: StepType;
  options?: string[];
  placeholder?: string;
  hint?: string;
}

// --- 공통 스텝 ---
const STEP_1: Step[] = [
  {
    id: 1,
    type: "single",
    question: "디자인 외주 가격, 이미 정해진 상태인가요?",
    options: ["네, 이미 정해졌어요", "아니요, 이제 견적을 내야 해요"],
  },
];

const STEPS_2_TO_4: Step[] = [
  {
    id: 2,
    type: "single",
    question: "어떤 디자인 업무를 주로 하시나요?",
    options: ["웹 UI/UX", "앱 UI/UX"],
  },
  {
    id: 3,
    type: "single",
    question: "실무 경력은 어느 정도 되셨나요?",
    options: ["1년 미만", "1~3년차 (주니어)", "4~6년차 (미들)", "7~9년차 (시니어)", "10년차 이상 (리더)"],
  },
  {
    id: 4,
    type: "multi",
    question: "디자인 관련 자격증을 보유하고 계신가요?",
    options: ["없음", "웹디자인기능사", "시각디자인·산업기사", "기타 자격증"],
  },
];

// --- 분기 5~6번 ---
const DECIDED_STEPS: Step[] = [
  {
    id: 5,
    type: "single",
    question: "가장 최근 프로젝트는 어떻게 일하셨나요?",
    options: ["100% 상주", "100% 원격", "상주+원격 혼합"],
  },
  {
    id: 6,
    type: "single",
    question: "해당 프로젝트의 계약 방식은 무엇인가요?",
    options: ["월 단위 계약", "건별 외주 계약"],
  },
];

const UNDECIDED_STEPS: Step[] = [
  {
    id: 5,
    type: "single",
    question: "진행할 프로젝트는 어떤 근무 형태를 원하시나요?",
    options: ["100% 상주", "100% 원격", "상주+원격 혼합"],
  },
  {
    id: 6,
    type: "single",
    question: "어떤 계약 방식을 생각중이신가요?",
    options: ["월 단위 계약", "건별 외주 계약"],
  },
];

// --- 분기 7~8번 ---
const DECIDED_MONTHLY: Step[] = [
  {
    id: 7,
    type: "text",
    question: "월평균 세전 급여는 얼마인가요?",
    placeholder: "만 원 단위로 입력해주세요",
  },
];

const DECIDED_FREELANCE: Step[] = [
  {
    id: 7,
    type: "single",
    question: "해당 외주의 작업 소요 기간은 어느 정도였나요?",
    options: ["1주일 이하", "2~3주", "1개월", "2~3개월", "3개월 이상"],
  },
  {
    id: 8,
    type: "text",
    question: "총 계약 금액은 얼마인가요?",
    placeholder: "만 원 단위로 입력해주세요",
  },
];

const UNDECIDED_MONTHLY: Step[] = [
  {
    id: 7,
    type: "text",
    question: "'1차 목표 금액' 을 가볍게 적어주세요.",
    placeholder: "만 원 단위로 입력해주세요",
    hint: "진짜 감이 안 와요 (건너뛰기)",
  },
];

const UNDECIDED_FREELANCE: Step[] = [
  {
    id: 7,
    type: "single",
    question: "작업에는 대략 어느 정도의 기간을 투자할 수 있나요?",
    options: ["1주일 이하", "2~3주", "1개월", "2~3개월", "3개월 이상"],
  },
  {
    id: 8,
    type: "text",
    question: "'1차 목표 금액' 을 가볍게 적어주세요.",
    placeholder: "만 원 단위로 입력해주세요",
    hint: "진짜 감이 안 와요 (건너뛰기)",
  },
];

// --- getSteps ---
export const getSteps = (priceDecided?: string, contractType?: string): Step[] => {
  const base5_6 = priceDecided === "네, 이미 정해졌어요" ? DECIDED_STEPS : UNDECIDED_STEPS;
  const base = [...STEP_1, ...STEPS_2_TO_4, ...base5_6];

  if (!priceDecided) return [...STEP_1, ...STEPS_2_TO_4, ...DECIDED_STEPS];
  if (!contractType) return base;

  const isDecided = priceDecided === "네, 이미 정해졌어요";
  const isMonthly = contractType === "월 단위 계약";

  if (isDecided) return [...base, ...(isMonthly ? DECIDED_MONTHLY : DECIDED_FREELANCE)];
  return [...base, ...(isMonthly ? UNDECIDED_MONTHLY : UNDECIDED_FREELANCE)];
};