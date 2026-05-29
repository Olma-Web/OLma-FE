export const jobCategoryMap: Record<string, number> = {
  "웹 UI/UX": 14,
  "앱 UI/UX": 28,
};

export const experienceLevelMap: Record<string, number> = {
  "1년 미만": 1,
  "1~3년차 (주니어)": 2,
  "4~6년차 (미들)": 3,
  "7~9년차 (시니어)": 4,
  "10년차 이상 (리더)": 5,
};

export const workFormatMap: Record<string, string> = {
  "100% 상주": "ON_SITE",
  "100% 원격": "REMOTE",
  "상주+원격 혼합": "HYBRID",
};

export const durationMap: Record<string, string> = {
  "1주일 이하": "1주일 이하",
  "2~3주": "2~3주",
  "1개월": "1개월",
  "2~3개월": "2~3개월",
  "3개월 이상": "3개월 이상",
};

// 자격증 선택 → certificate_types 테이블 ID (V8 migration 기준)
export const certificateMap: Record<string, number> = {
  "웹디자인기능사": 1,
  "시각디자인·산업기사": 2,
  "기타 자격증": 3,
};