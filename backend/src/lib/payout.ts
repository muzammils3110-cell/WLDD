import { Milestone } from "../types";

export interface PayoutInput {
  views: number;
  milestones: Milestone[];
  currentPayout: number;
  remainingBudget: number;
}

export interface PayoutResult {
  /** Payout of the highest milestone crossed (0 if none) */
  milestonePayout: number;
  /** Extra amount to pay now, after the budget cap */
  increment: number;
  /** currentPayout + increment */
  newPayout: number;
  /** True if the budget cap reduced the increment */
  capped: boolean;
}

export function calculatePayout(input: PayoutInput): PayoutResult {
  const { views, milestones, currentPayout, remainingBudget } = input;

  if (!Number.isFinite(views) || views < 0) {
    throw new Error("views must be a non-negative number");
  }

  // Highest milestone crossed (sorted copy, so input order doesn't matter)
  const sorted = [...milestones].sort((a, b) => a.views - b.views);
  let milestonePayout = 0;
  for (const m of sorted) {
    if (views >= m.views) milestonePayout = m.payout;
    else break;
  }

  // Never pay less than what's already paid (no clawback)
  const desiredIncrement = Math.max(0, milestonePayout - currentPayout);

  // Never pay more than the campaign has left
  const available = Math.max(0, remainingBudget);
  const increment = Math.min(desiredIncrement, available);

  return {
    milestonePayout,
    increment,
    newPayout: currentPayout + increment,
    capped: increment < desiredIncrement,
  };
}