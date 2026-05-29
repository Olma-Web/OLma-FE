const BASE_URL = "http://13.124.31.106";

const ERROR_MESSAGES: Record<string, string> = {
  "nickname already in use": "이미 사용 중인 닉네임이에요.",
  "email already in use": "이미 사용 중인 이메일이에요.",
  "invalid credentials": "이메일 또는 비밀번호가 올바르지 않아요.",
  "user not found": "존재하지 않는 계정이에요.",
};

function translateError(message: string): string {
  return ERROR_MESSAGES[message.toLowerCase()] ?? message;
}

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(translateError(err.message));
  }

  return res.json();
}

// 인증
export const authAPI = {
  signup: (email: string, password: string, nickname: string) =>
    fetchAPI("/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, nickname }),
    }),

  login: (email: string, password: string) =>
    fetchAPI("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

// 온보딩 제출
export const submissionAPI = {
  submit: (body: Record<string, unknown>) =>
    fetchAPI("/v1/submissions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// 유저 프로필 및 제출 이력
export const userAPI = {
  getProfile: (userId: number) =>
    fetchAPI(`/v1/users/${userId}`),

  getSubmissions: (userId: number) =>
    fetchAPI(`/v1/users/${userId}/submissions`),

  updateProfile: (userId: number, body: {
    jobCategoryId?: number;
    experienceLevelId?: number;
    certificateTypeIds?: number[];
  }) =>
    fetchAPI(`/v1/users/${userId}/profile`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

// 단가 기록 삭제
export const submissionDeleteAPI = {
  delete: (submissionId: number) =>
    fetch(`${BASE_URL}/v1/submissions/${submissionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(typeof window !== "undefined" && localStorage.getItem("token")
          ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
          : {}),
      },
    }).then((res) => {
      if (!res.ok && res.status !== 204) throw new Error("삭제에 실패했습니다.");
    }),
};

// 견적서 보관함
export const estimateAPI = {
  getList: (userId: number) =>
    fetchAPI(`/v1/users/${userId}/estimates`),

  delete: (estimateId: number) =>
    fetch(`${BASE_URL}/v1/estimates/${estimateId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(typeof window !== "undefined" && localStorage.getItem("token")
          ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
          : {}),
      },
    }).then((res) => {
      if (!res.ok && res.status !== 204) throw new Error("삭제에 실패했습니다.");
    }),
};

// 커리어 보관함 저장
export const careerSaveAPI = {
  save: (body: {
    jobCategoryId: number;
    experienceLevelId: number;
    userId: number;
    submissionType: string;
    workFormat: string;
    duration?: string;
    amount: number;
    amountUnit: string;
    sessionId: string;
  }) =>
    fetchAPI("/v1/submissions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// 벤치마크
export const benchmarkAPI = {
  get: (params: {
    jobCategoryId: number;
    experienceLevelId?: number;
    workFormat?: string;
    userAmount?: number;
  }) => {
    if (params.jobCategoryId == null) {
      return Promise.reject(new Error("jobCategoryId가 없습니다."));
    }
    const qs = new URLSearchParams();
    qs.set("jobCategoryId", String(params.jobCategoryId));
    if (params.experienceLevelId != null) qs.set("experienceLevelId", String(params.experienceLevelId));
    if (params.workFormat != null) qs.set("workFormat", params.workFormat);
    if (params.userAmount != null) qs.set("userAmount", String(params.userAmount));
    return fetchAPI(`/v1/benchmark?${qs.toString()}`);
  },
};