import { Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { Campaign } from "../models/Campaign";
import { ISubmission, Submission } from "../models/Submission";
import { applyViewUpdate } from "../services/payout.service";
import { AuthRequest } from "../types";
import { asyncHandler } from "../utils/asyncHandler";
import {
  normalizePostUrl,
  validateObjectId,
  validateViewsInput,
} from "../utils/submissionValidators";

function formatSubmission(
  s: ISubmission,
  campaign?: { name: string; platform: string } | null
) {
  return {
    id: String(s._id),
    campaignId: String(s.campaignId),
    campaignName: campaign?.name,
    platform: campaign?.platform,
    postUrl: s.postUrl,
    views: s.views,
    currentPayout: s.currentPayout,
    createdAt: s.createdAt,
  };
}

export const createSubmission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const campaignId = validateObjectId(req.body?.campaignId, "campaignId");

  const campaign = await Campaign.findById(campaignId);
  if (!campaign || !campaign.isActive) {
    throw new AppError("Campaign not found or no longer live", 404);
  }

  const postUrl = normalizePostUrl(req.body?.postUrl, campaign.platform);

  let submission: ISubmission;
  try {
    submission = await Submission.create({
      campaignId: campaign._id,
      creatorId: req.user!.userId,
      postUrl,
      views: 0,
      currentPayout: 0,
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new AppError("This post has already been submitted to this campaign", 409);
    }
    throw err;
  }

  res.status(201).json({ submission: formatSubmission(submission, campaign) });
});

export const getMySubmissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const submissions = await Submission.find({ creatorId: req.user!.userId }).sort({
    createdAt: -1,
  });

  const campaignIds = [...new Set(submissions.map((s) => String(s.campaignId)))];
  const campaigns = await Campaign.find({ _id: { $in: campaignIds } }, "name platform");
  const campaignMap = new Map(campaigns.map((c) => [String(c._id), c]));

  const totalEarnings = submissions.reduce((sum, s) => sum + s.currentPayout, 0);

  res.json({
    totalEarnings,
    submissions: submissions.map((s) =>
      formatSubmission(s, campaignMap.get(String(s.campaignId)))
    ),
  });
});

export const updateSubmissionViews = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = validateObjectId(req.params.id, "submission id");
    const views = validateViewsInput(req.body);

    const result = await applyViewUpdate(id, views);

    res.json({
      submission: formatSubmission(result.submission),
      payoutAdded: result.payoutAdded,
      budgetCapped: result.capped,
      campaignRemainingBudget: result.campaignRemainingBudget,
    });
  }
);