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