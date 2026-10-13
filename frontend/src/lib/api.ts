import {
  AuthResponse,
  Campaign,
  CampaignInput,
  MySubmissionsResponse,
  Role,
  Submission,
  User,
} from "@/types";

export interface UpdateViewsResponse {
  submission: Submission;
  payoutAdded: number;
  budgetCapped: boolean;
  campaignRemainingBudget: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "memed_token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export const api = {
  signup: (email: string, password: string, role: Role) =>
    request<AuthResponse>("/auth/signup", { method: "POST", body: { email, password, role } }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: { email, password } }),

  me: () => request<{ user: User }>("/auth/me"),

  createCampaign: (input: CampaignInput) =>
    request<{ campaign: Campaign }>("/campaigns", { method: "POST", body: input }),

  getMyCampaigns: () => request<{ campaigns: Campaign[] }>("/campaigns/mine"),

  getLiveCampaigns: () => request<{ campaigns: Campaign[] }>("/campaigns"),

  createSubmission: (campaignId: string, postUrl: string) =>
    request<{ submission: Submission }>("/submissions", {
      method: "POST",
      body: { campaignId, postUrl },
    }),

  getMySubmissions: () => request<MySubmissionsResponse>("/submissions/mine"),

  updateViews: (submissionId: string, views: number) =>
    request<UpdateViewsResponse>(`/submissions/${submissionId}/views`, {
      method: "PATCH",
      body: { views },
    }),
};