export type Role = "brand" | "creator";
export type Platform = "instagram" | "youtube";

export interface Milestone {
  views: number;
  payout: number;
}

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  milestones: Milestone[];
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  isActive: boolean;
  brandId: string;
  createdAt: string;
}

export interface CampaignInput {
  name: string;
  platform: Platform;
  totalBudget: number;
  milestones: Milestone[];
}

export interface Submission {
  id: string;
  campaignId: string;
  campaignName?: string;
  platform?: Platform;
  postUrl: string;
  views: number;
  currentPayout: number;
  createdAt: string;
}

export interface MySubmissionsResponse {
  totalEarnings: number;
  submissions: Submission[];
}