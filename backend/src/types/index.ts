import { Request } from "express";

export type Role = "brand" | "creator";
export type Platform = "instagram" | "youtube";

export interface Milestone {
  views: number;
  payout: number;
}

export interface AuthPayload {
  userId: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}