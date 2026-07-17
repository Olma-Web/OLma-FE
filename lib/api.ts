const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

const ERROR_MESSAGES: Record<string, string> = {
  "nickname already in use": "이미 사용 중인 닉네임이에요.",
  "email already in use": "이미 사용 중인 이메일이에요.",
  "invalid credentials": "이메일 또는 비밀번호가 올바르지 않아요.",
  "user not found": "존재하지 않는 계정이에요.",
};

function translateError(message: string): string {
  return ERROR_MESSAGES[message.toLowerCase()] ?? message;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new ApiError(translateError(err.message), res.status);
  }

  // 204 No Content는 응답 본문이 없음
  if (res.status === 204) {
    return null;
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

  logout: () =>                                          // ← 추가
    fetchAPI("/v1/auth/logout", { method: "POST" }),     // ← 추가
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

  saveSpecProgress: (userId: number, body: {
    jobCategoryId?: number;
    experienceLevelId?: number;
    certificateTypeIds?: number[];
  }) =>
    fetchAPI(`/v1/users/${userId}/profile`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  getMe: () =>
    fetchAPI("/v1/users/me/profile"),

  changePassword: (body: {
    currentPassword: string;
    newPassword: string;
  }) =>
    fetchAPI("/v1/users/me/password", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  withdraw: () =>
    fetchAPI("/v1/users/me", {
      method: "DELETE",
    }),
};

// 기준 데이터
export const referenceAPI = {
  getJobCategories: () =>
    fetchAPI("/v1/reference/job-categories"),

  getExperienceLevels: () =>
    fetchAPI("/v1/reference/experience-levels"),
};

// 단가 기록 삭제
export const submissionDeleteAPI = {
  delete: (submissionId: number) =>
    fetch(`${BASE_URL}/v1/submissions/${submissionId}`, {
      method: "DELETE",
      credentials: "omit",
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
  getList: () =>
    fetchAPI(`/v1/estimates`),

  getById: (estimateId: number) =>
    fetchAPI(`/v1/estimates/${estimateId}`),

  startNegotiationSimulation: (estimateId: number) =>
    fetchAPI(`/v1/estimates/${estimateId}/negotiation-simulation/start`, {
      method: "PATCH",
    }),

  completeNegotiationSimulation: (estimateId: number, state: unknown) =>
    fetchAPI(`/v1/estimates/${estimateId}/negotiation-simulation/complete`, {
      method: "PATCH",
      body: JSON.stringify({ state }),
    }),

  delete: (estimateId: number) =>
    fetch(`${BASE_URL}/v1/estimates/${estimateId}`, {
      method: "DELETE",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        ...(typeof window !== "undefined" && localStorage.getItem("token")
          ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
          : {}),
      },
    }).then((res) => {
      if (!res.ok && res.status !== 204) throw new Error("삭제에 실패했습니다.");
    }),

  calculate: (body: {
    experienceLevelId: number;
    jobCategoryId: number;
    screenCount: number;
    uxEngagement: "GUI_ONLY" | "WIREFRAME_PLUS" | "FULL_PLANNING";
    platformEnvironment: "MOBILE_APP" | "PC_WEB" | "RESPONSIVE_WEB";
    addons?: ("DESIGN_SYSTEM" | "PROTOTYPING" | "SOURCE_TRANSFER")[];
  }) =>
    fetchAPI("/v1/estimates/calculate", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  save: (body: {
    experienceLevelId: number;
    jobCategoryId: number;
    screenCount: number;
    uxEngagement: "GUI_ONLY" | "WIREFRAME_PLUS" | "FULL_PLANNING";
    platformEnvironment: "MOBILE_APP" | "PC_WEB" | "RESPONSIVE_WEB";
    addons?: ("DESIGN_SYSTEM" | "PROTOTYPING" | "SOURCE_TRANSFER")[];
    projectName?: string;
    negotiationTargetBudgetAmount?: number;
  }) =>
    fetchAPI("/v1/estimates", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  simulateNegotiation: (body: {
    experienceLevelId: number;
    jobCategoryId: number;
    screenCount: number;
    uxEngagement: "GUI_ONLY" | "WIREFRAME_PLUS" | "FULL_PLANNING";
    platformEnvironment: "MOBILE_APP" | "PC_WEB" | "RESPONSIVE_WEB";
    addons?: ("DESIGN_SYSTEM" | "PROTOTYPING" | "SOURCE_TRANSFER")[];
    targetBudgetAmount: number;
  }) =>
    fetchAPI("/v1/estimates/negotiation/simulate", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateProjectName: (estimateId: number, projectName: string) =>
    fetchAPI(`/v1/estimates/${estimateId}/project-name`, {
      method: "PATCH",
      body: JSON.stringify({ projectName }),
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
    projectName?: string;
  }) =>
    fetchAPI("/v1/submissions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getById: (id: number) =>
    fetchAPI(`/v1/submissions/${id}`),

  updateProjectName: (submissionId: number, projectName: string) =>
    fetchAPI(`/v1/submissions/${submissionId}/project-name`, {
      method: "PATCH",
      body: JSON.stringify({ projectName }),
    }),
};

// 커뮤니티
export const communityAPI = {
  getPosts: (params?: {
    category?: "QNA" | "INFO" | "FREE";
    sort?: "LATEST" | "LIKES" | "COMMENTS";
    jobCategoryId?: number;
    experienceLevelId?: number;
    page?: number;
    size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.sort) qs.set("sort", params.sort);
    if (params?.jobCategoryId != null) qs.set("jobCategoryId", String(params.jobCategoryId));
    if (params?.experienceLevelId != null) qs.set("experienceLevelId", String(params.experienceLevelId));
    qs.set("page", String(params?.page ?? 0));
    qs.set("size", String(params?.size ?? 20));
    return fetchAPI(`/v1/community/posts?${qs.toString()}`);
  },

  getPost: (postId: number) =>
    fetchAPI(`/v1/community/posts/${postId}`),

  createPost: (body: { title: string; content: string; category: "QNA" | "INFO" | "FREE"; imageUrls?: string[] }) =>
    fetchAPI("/v1/community/posts", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updatePost: (postId: number, body: { title: string; content: string; category: "QNA" | "INFO" | "FREE"; imageUrls?: string[] }) =>
    fetchAPI(`/v1/community/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deletePost: (postId: number) =>
    fetchAPI(`/v1/community/posts/${postId}`, { method: "DELETE" }),

  reportPost: (postId: number, body: { reason: "ABUSE" | "FALSE_INFO" | "SPAM" | "ETC"; detail?: string }) =>
    fetchAPI(`/v1/community/posts/${postId}/reports`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  likePost: (postId: number) =>
    fetchAPI(`/v1/community/posts/${postId}/likes`, { method: "POST" }),

  unlikePost: (postId: number) =>
    fetchAPI(`/v1/community/posts/${postId}/likes`, { method: "DELETE" }),

  createComment: (postId: number, body: { content: string; parentCommentId?: number }) =>
    fetchAPI(`/v1/community/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateComment: (commentId: number, body: { content: string }) =>
    fetchAPI(`/v1/community/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteComment: (commentId: number) =>
    fetchAPI(`/v1/community/comments/${commentId}`, { method: "DELETE" }),

  reportComment: (commentId: number, body: { reason: "ABUSE" | "FALSE_INFO" | "SPAM" | "ETC"; detail?: string }) =>
    fetchAPI(`/v1/community/comments/${commentId}/reports`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  likeComment: (commentId: number) =>
    fetchAPI(`/v1/community/comments/${commentId}/likes`, { method: "POST" }),

  unlikeComment: (commentId: number) =>
    fetchAPI(`/v1/community/comments/${commentId}/likes`, { method: "DELETE" }),

  getMyPosts: (page = 0, size = 20) =>
    fetchAPI(`/v1/community/me/posts?page=${page}&size=${size}`),

  getMyComments: (page = 0, size = 20) =>
    fetchAPI(`/v1/community/me/comments?page=${page}&size=${size}`),
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
