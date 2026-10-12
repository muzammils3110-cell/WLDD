import { AppError } from "../middleware/errorHandler";
import { Milestone, Platform, Role } from "../types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLATFORMS: Platform[] = ["instagram", "youtube"];
const MAX_MILESTONES = 20;

export function validateSignupInput(body: any): {
  email: string;
  password: string;
  role: Role;
} {
  const { email, password, role } = body ?? {};

  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    throw new AppError("A valid email is required", 400);
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }
  if (role !== "brand" && role !== "creator") {
    throw new AppError("Role must be either 'brand' or 'creator'", 400);
  }

  return { email: email.trim().toLowerCase(), password, role };
}

export function validateLoginInput(body: any): {
  email: string;
  password: string;
} {
  const { email, password } = body ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  return { email: email.trim().toLowerCase(), password };
}

export function validateCampaignInput(body: any): {
  name: string;
  platform: Platform;
  totalBudget: number;
  milestones: Milestone[];
} {
  const { name, platform, totalBudget, milestones } = body ?? {};

  if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 100) {
    throw new AppError("Campaign name is required (max 100 characters)", 400);
  }

  const normalizedPlatform =
    typeof platform === "string" ? (platform.toLowerCase() as Platform) : undefined;
  if (!normalizedPlatform || !PLATFORMS.includes(normalizedPlatform)) {
    throw new AppError("Platform must be 'instagram' or 'youtube'", 400);
  }

  if (!Number.isInteger(totalBudget) || totalBudget <= 0) {
    throw new AppError("Total budget must be a positive whole number (INR)", 400);
  }

  if (!Array.isArray(milestones) || milestones.length === 0) {
    throw new AppError("At least one milestone is required", 400);
  }
  if (milestones.length > MAX_MILESTONES) {
    throw new AppError(`A campaign can have at most ${MAX_MILESTONES} milestones`, 400);
  }

  const cleaned: Milestone[] = milestones.map((m: any) => {
    if (
      !m ||
      !Number.isInteger(m.views) ||
      m.views <= 0 ||
      !Number.isInteger(m.payout) ||
      m.payout <= 0
    ) {
      throw new AppError(
        "Each milestone needs a positive whole number of views and payout",
        400
      );
    }
    return { views: m.views, payout: m.payout };
  });

  cleaned.sort((a, b) => a.views - b.views);

  for (let i = 1; i < cleaned.length; i++) {
    if (cleaned[i].views === cleaned[i - 1].views) {
      throw new AppError("Milestone view thresholds must be unique", 400);
    }
    if (cleaned[i].payout <= cleaned[i - 1].payout) {
      throw new AppError(
        "Payouts must increase as view thresholds increase",
        400
      );
    }
  }

  return {
    name: name.trim(),
    platform: normalizedPlatform,
    totalBudget,
    milestones: cleaned,
  };
}