import { Document, Schema, Types, model } from "mongoose";
import { Milestone, Platform } from "../types";

export interface ICampaign extends Document {
  name: string;
  platform: Platform;
  totalBudget: number;
  spentBudget: number;
  milestones: Milestone[];
  brandId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<Milestone>(
  {
    views: { type: Number, required: true, min: 1 },
    payout: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    platform: { type: String, enum: ["instagram", "youtube"], required: true },
    totalBudget: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "totalBudget must be a whole number of rupees",
      },
    },
    spentBudget: { type: Number, default: 0, min: 0 },
    milestones: {
      type: [milestoneSchema],
      validate: [
        {
          validator: (m: Milestone[]) => m.length > 0,
          message: "At least one milestone is required",
        },
        {
          validator: (m: Milestone[]) =>
            m.every(
              (item, i) =>
                Number.isInteger(item.views) &&
                Number.isInteger(item.payout) &&
                (i === 0 ||
                  (item.views > m[i - 1].views && item.payout > m[i - 1].payout))
            ),
          message:
            "Milestones must use whole numbers, with views and payouts strictly increasing",
        },
      ],
    },
    brandId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Keep the ladder ordered by views before validation runs
campaignSchema.pre("validate", function () {
  if (Array.isArray(this.milestones)) {
    this.milestones.sort((a, b) => a.views - b.views);
  }
});

export const Campaign = model<ICampaign>("Campaign", campaignSchema);