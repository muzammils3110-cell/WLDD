import { Document, Schema, Types, model } from "mongoose";

export interface ISubmission extends Document {
  campaignId: Types.ObjectId;
  creatorId: Types.ObjectId;
  postUrl: string;
  views: number;
  currentPayout: number;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postUrl: { type: String, required: true, trim: true },
    views: { type: Number, default: 0, min: 0 },
    currentPayout: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// The same post can't be submitted twice to the same campaign
submissionSchema.index({ campaignId: 1, postUrl: 1 }, { unique: true });

export const Submission = model<ISubmission>("Submission", submissionSchema);