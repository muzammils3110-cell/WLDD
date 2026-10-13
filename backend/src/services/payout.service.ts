import mongoose from "mongoose";
import { calculatePayout } from "../lib/payout";
import { AppError } from "../middleware/errorHandler";
import { Campaign } from "../models/Campaign";
import { ISubmission, Submission } from "../models/Submission";

export interface ViewUpdateResult {
  submission: ISubmission;
  payoutAdded: number;
  capped: boolean;
  campaignRemainingBudget: number;
}

export async function applyViewUpdate(
  submissionId: string,
  newViews: number
): Promise<ViewUpdateResult> {
  const session = await mongoose.startSession();

  try {
    let result: ViewUpdateResult | undefined;

    // withTransaction automatically retries on transient errors such as write conflicts
    await session.withTransaction(async () => {
      const submission = await Submission.findById(submissionId).session(session);
      if (!submission) throw new AppError("Submission not found", 404);

      const campaign = await Campaign.findById(submission.campaignId).session(session);
      if (!campaign) throw new AppError("Campaign not found", 404);

      const payout = calculatePayout({
        views: newViews,
        milestones: campaign.milestones,
        currentPayout: submission.currentPayout,
        remainingBudget: campaign.totalBudget - campaign.spentBudget,
      });

      let remaining = campaign.totalBudget - campaign.spentBudget;

      if (payout.increment > 0) {
        // Only matches if the budget can still cover the increment
        const updatedCampaign = await Campaign.findOneAndUpdate(
          {
            _id: campaign._id,
            $expr: {
              $lte: [{ $add: ["$spentBudget", payout.increment] }, "$totalBudget"],
            },
          },
          { $inc: { spentBudget: payout.increment } },
          { returnDocument: "after", session }
        );

        if (!updatedCampaign) {
          throw new AppError("Campaign budget changed, please retry", 409);
        }
        remaining = updatedCampaign.totalBudget - updatedCampaign.spentBudget;
      }

      // Only matches if nobody changed this submission's payout since we read it
      const updatedSubmission = await Submission.findOneAndUpdate(
        { _id: submission._id, currentPayout: submission.currentPayout },
        { $set: { views: newViews, currentPayout: payout.newPayout } },
        { returnDocument: "after", session }
      );

      if (!updatedSubmission) {
        throw new AppError("Submission was updated concurrently, please retry", 409);
      }

      result = {
        submission: updatedSubmission,
        payoutAdded: payout.increment,
        capped: payout.capped,
        campaignRemainingBudget: remaining,
      };
    });

    if (!result) throw new AppError("Failed to update views", 500);
    return result;
  } finally {
    await session.endSession();
  }
}