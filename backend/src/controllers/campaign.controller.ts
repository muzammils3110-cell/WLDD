import { Response } from "express";
import { ICampaign, Campaign } from "../models/Campaign";
import { AuthRequest } from "../types";
import { asyncHandler } from "../utils/asyncHandler";
import { validateCampaignInput } from "../utils/validators";

function formatCampaign(c: ICampaign) {
  return {
    id: String(c._id),
    name: c.name,
    platform: c.platform,
    milestones: c.milestones,
    totalBudget: c.totalBudget,
    spentBudget: c.spentBudget,
    remainingBudget: c.totalBudget - c.spentBudget,
    isActive: c.isActive,
    brandId: String(c.brandId),
    createdAt: c.createdAt,
  };
}

export const createCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const input = validateCampaignInput(req.body);

  const campaign = await Campaign.create({
    ...input,
    spentBudget: 0,
    brandId: req.user!.userId,
  });

  res.status(201).json({ campaign: formatCampaign(campaign) });
});

export const getMyCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const campaigns = await Campaign.find({ brandId: req.user!.userId }).sort({
    createdAt: -1,
  });

  res.json({ campaigns: campaigns.map(formatCampaign) });
});

export const getLiveCampaigns = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const campaigns = await Campaign.find({ isActive: true }).sort({ createdAt: -1 });

  res.json({ campaigns: campaigns.map(formatCampaign) });
});