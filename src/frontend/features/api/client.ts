import type {
  ChildPointAccount,
  ParentDashboard,
  PointLedger,
  StudyTask,
  Subject,
  TaskType,
  User,
  Wish
} from "@/features/tasks/types";

const TOKEN_KEY = "zhizhi_auth_token";
const USER_KEY = "zhizhi_auth_user";
export const AUTH_REDIRECT_NOTICE_KEY = "zhizhi_auth_redirect_notice";
const AUTH_REQUIRED_MESSAGE = "请先登录后再继续使用。";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

const RETRYABLE_STATUS_CODES = new Set([408, 502, 503, 504]);
const MAX_READ_ATTEMPTS = 3;

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function storeSession(token: string, user: User) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

function getFriendlyErrorMessage(status: number, code?: string, message?: string) {
  if (status === 401 && code === "UNAUTHENTICATED") {
    return AUTH_REQUIRED_MESSAGE;
  }

  if (status === 401 && code === "INVALID_CREDENTIALS") {
    return "用户名或密码不正确，请重新输入。";
  }

  if (status === 403 && code === "FORBIDDEN") {
    return "当前账号没有权限访问这个内容。";
  }

  return message ?? "请求失败，请稍后重试";
}

function redirectToLoginForAuthRequired() {
  if (typeof window === "undefined") {
    return;
  }

  clearSession();
  window.sessionStorage.setItem(AUTH_REDIRECT_NOTICE_KEY, AUTH_REQUIRED_MESSAGE);

  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (window.location.pathname === "/login") {
    return;
  }

  const loginUrl = `/login?next=${encodeURIComponent(currentPath)}`;
  window.location.replace(loginUrl);
}

function getRequestMethod(init: RequestInit) {
  return (init.method ?? "GET").toUpperCase();
}

function shouldRetryReadRequest(method: string, response: Response) {
  return ["GET", "HEAD"].includes(method) && RETRYABLE_STATUS_CODES.has(response.status);
}

async function waitForRetry(attempt: number) {
  const delayMs = Math.min(250 * 2 ** attempt, 1000);
  await new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

async function fetchWithRetry(path: string, init: RequestInit) {
  const method = getRequestMethod(init);
  const maxAttempts = ["GET", "HEAD"].includes(method) ? MAX_READ_ATTEMPTS : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`/api/backend${path}`, init);

      if (attempt < maxAttempts - 1 && shouldRetryReadRequest(method, response)) {
        await waitForRetry(attempt);
        continue;
      }

      return response;
    } catch (error) {
      if (attempt < maxAttempts - 1) {
        await waitForRetry(attempt);
        continue;
      }

      throw new ApiError(503, "网络连接中断，请稍后重试", "NETWORK_UNAVAILABLE");
    }
  }

  throw new ApiError(503, "网络连接中断，请稍后重试", "NETWORK_UNAVAILABLE");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getStoredToken();
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetchWithRetry(path, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Keep the fallback message below for non-JSON failures.
    }

    const code = body.error?.code;
    const message = getFriendlyErrorMessage(response.status, code, body.error?.message);

    if (response.status === 401 && code === "UNAUTHENTICATED") {
      redirectToLoginForAuthRequired();
    }

    throw new ApiError(response.status, message, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function login(username: string, password: string) {
  return request<{ token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function getMe() {
  return request<{ user: User }>("/auth/me");
}

export async function getParentDashboard() {
  return request<ParentDashboard>("/parent/dashboard");
}

export async function getTodayTasks(
  options: { includeOverdueIncomplete?: boolean; includeCompleted?: boolean } = {}
) {
  const params = new URLSearchParams();
  if (options.includeOverdueIncomplete) {
    params.set("includeOverdueIncomplete", "true");
  }
  if (options.includeCompleted) {
    params.set("includeCompleted", "true");
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<{ tasks: StudyTask[] }>(`/tasks/today${query}`);
}

export async function getCalendarTasks(month: string) {
  const params = new URLSearchParams({ month });
  return request<{ tasks: StudyTask[] }>(`/tasks/calendar?${params.toString()}`);
}

export async function getHistoryTasks(
  options: { childUserId?: string; startDate?: string; endDate?: string } = {}
) {
  const params = new URLSearchParams();
  if (options.childUserId) {
    params.set("childUserId", options.childUserId);
  }
  if (options.startDate) {
    params.set("startDate", options.startDate);
  }
  if (options.endDate) {
    params.set("endDate", options.endDate);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<{ tasks: StudyTask[] }>(`/tasks/history${query}`);
}

export async function getTask(taskId: string) {
  return request<{ task: StudyTask }>(`/tasks/${encodeURIComponent(taskId)}`);
}

export type CreateTaskInput = {
  childUserId: string;
  subject: Subject;
  taskType: TaskType;
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string;
  needPhoto: boolean;
  needAiCheck: boolean;
  rewardPoints: number;
};

export async function createTask(input: CreateTaskInput) {
  return request<{ task: StudyTask }>("/tasks", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function submitTask(
  taskId: string,
  input: { completed: true; imageUrls?: string[]; childNote?: string }
) {
  return request<{ task: StudyTask }>(`/tasks/${encodeURIComponent(taskId)}/submissions`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function uploadPhoto(file: File) {
  const formData = new FormData();
  formData.set("photo", file);

  return request<{ url: string; fileName: string; size: number; contentType: string }>("/uploads/photos", {
    method: "POST",
    body: formData
  });
}

export type UpdateTaskInput = {
  subject?: Subject;
  taskType?: TaskType;
  title?: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  needPhoto?: boolean;
  needAiCheck?: boolean;
  rewardPoints?: number;
};

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  return request<{ task: StudyTask }>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function deleteTask(taskId: string) {
  return request<void>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE"
  });
}

export async function reviewTask(
  taskId: string,
  input: { reviewResult: "pass" | "need_resubmit"; comment?: string }
) {
  return request<{ task: StudyTask; pointLedger: PointLedger | null }>(`/tasks/${encodeURIComponent(taskId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getPointAccount(options: { childUserId?: string } = {}) {
  const params = new URLSearchParams();
  if (options.childUserId) {
    params.set("childUserId", options.childUserId);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<{ account: ChildPointAccount; ledger: PointLedger[] }>(`/points/account${query}`);
}

export async function getWishes(options: { childUserId?: string } = {}) {
  const params = new URLSearchParams();
  if (options.childUserId) {
    params.set("childUserId", options.childUserId);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<{ wishes: Wish[] }>(`/wishes${query}`);
}

export async function getWish(wishId: string) {
  return request<{ wish: Wish }>(`/wishes/${encodeURIComponent(wishId)}`);
}

export async function createWish(input: { title: string; description?: string }) {
  return request<{ wish: Wish }>("/wishes", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export type UpdateWishInput = {
  title: string;
  description?: string;
};

export async function updateWish(wishId: string, input: UpdateWishInput) {
  return request<{ wish: Wish }>(`/wishes/${encodeURIComponent(wishId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function deleteWish(wishId: string) {
  return request<void>(`/wishes/${encodeURIComponent(wishId)}`, {
    method: "DELETE"
  });
}

export async function approveWish(wishId: string, input: { requiredPoints: number }) {
  return request<{ wish: Wish }>(`/wishes/${encodeURIComponent(wishId)}/approve`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function rejectWish(wishId: string, input: { rejectReason?: string }) {
  return request<{ wish: Wish }>(`/wishes/${encodeURIComponent(wishId)}/reject`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function requestWishRedeem(wishId: string) {
  return request<{ wish: Wish }>(`/wishes/${encodeURIComponent(wishId)}/redeem-requests`, {
    method: "POST"
  });
}

export async function confirmWishRedeem(wishId: string) {
  return request<{ wish: Wish; ledger: PointLedger }>(
    `/wishes/${encodeURIComponent(wishId)}/redeem-confirmations`,
    {
      method: "POST"
    }
  );
}
