import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { AppError } from "../src/middleware/errorHandler";
import { Campaign } from "../src/models/Campaign";
import { Submission } from "../src/models/Submission";
import { ViewUpdateResult, applyViewUpdate } from "../src/services/payout.service";

jest.setTimeout(60_000);

const TEST_URI = process.env.TEST_MONGODB_URI;
let replSet: MongoMemoryReplSet | undefined;

beforeAll(async () => {
  if (TEST_URI) {
    // Separate database so the tests never touch real data
    await mongoose.connect(TEST_URI, { dbName: "memed_test" });
  } else {
    // A replica set is required for multi-document transactions
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(replSet.getUri());
  }
  await Promise.all([Campaign.init(), Submission.init()]);
}, 180_000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});

beforeEach(async () => {
  await Promise.all([Campaign.deleteMany({}), Submission.deleteMany({})]);
});

async function makeCampaign(totalBudget: number) {
  return Campaign.create({
    name: "Test campaign",
    platform: "instagram",
    totalBudget,
    spentBudget: 0,
    brandId: new mongoose.Types.ObjectId(),
    milestones: [
      { views: 10_000, payout: 500 },
      { views: 100_000, payout: 5_000 },
    ],
  });
}

async function makeSubmissions(campaignId: mongoose.Types.ObjectId, count: number) {
  return Promise.all(
    Array.from({ length: count }, (_, i) =>
      Submission.create({
        campaignId,
        creatorId: new mongoose.Types.ObjectId(),
        postUrl: `https://instagram.com/reel/post${i}`,
      })
    )
  );
}

describe("applyViewUpdate - concurrency and idempotency", () => {
  it("never overspends when many creators cross a big milestone at once", async () => {
    const campaign = await makeCampaign(1_000);
    const subs = await makeSubmissions(campaign._id as mongoose.Types.ObjectId, 5);

    // Five creators each unlock a 5,000 payout against a 1,000 budget
    const results = await Promise.allSettled(
      subs.map((s) => applyViewUpdate(String(s._id), 200_000))
    );

    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<ViewUpdateResult> => r.status === "fulfilled"
    );
    expect(fulfilled.length).toBeGreaterThan(0);

    const after = await Campaign.findById(campaign._id);
    const allSubs = await Submission.find({ campaignId: campaign._id });
    const totalPaid = allSubs.reduce((sum, s) => sum + s.currentPayout, 0);
    const reportedPaid = fulfilled.reduce((sum, r) => sum + r.value.payoutAdded, 0);

    expect(after!.spentBudget).toBeLessThanOrEqual(1_000);
    expect(after!.spentBudget).toBe(1_000); // budget is fully used, never exceeded
    expect(totalPaid).toBe(after!.spentBudget); // payouts and campaign ledger agree
    expect(reportedPaid).toBe(after!.spentBudget);
  });

  it("splits a limited budget exactly across simultaneous updates", async () => {
    // 5 creators each want 500, but only 1,200 is available: 500 + 500 + 200
    const campaign = await makeCampaign(1_200);
    const subs = await makeSubmissions(campaign._id as mongoose.Types.ObjectId, 5);

    await Promise.allSettled(subs.map((s) => applyViewUpdate(String(s._id), 12_000)));

    const after = await Campaign.findById(campaign._id);
    const payouts = (await Submission.find({ campaignId: campaign._id }))
      .map((s) => s.currentPayout)
      .sort((a, b) => a - b);

    expect(after!.spentBudget).toBe(1_200);
    expect(payouts).toEqual([0, 0, 200, 500, 500]);
  });

  it("pays only once when the same view update is sent simultaneously", async () => {
    const campaign = await makeCampaign(10_000);
    const [sub] = await makeSubmissions(campaign._id as mongoose.Types.ObjectId, 1);

    await Promise.allSettled(
      Array.from({ length: 8 }, () => applyViewUpdate(String(sub._id), 12_000))
    );

    const after = await Campaign.findById(campaign._id);
    const updated = await Submission.findById(sub._id);

    expect(updated!.currentPayout).toBe(500);
    expect(after!.spentBudget).toBe(500);
  });

  it("does not pay again when the same update is repeated one after another", async () => {
    const campaign = await makeCampaign(10_000);
    const [sub] = await makeSubmissions(campaign._id as mongoose.Types.ObjectId, 1);

    const first = await applyViewUpdate(String(sub._id), 60_000);
    const second = await applyViewUpdate(String(sub._id), 60_000);

    expect(first.payoutAdded).toBe(500);
    expect(second.payoutAdded).toBe(0);

    const after = await Campaign.findById(campaign._id);
    expect(after!.spentBudget).toBe(500);
  });

  it("rejects an unknown submission with a 404", async () => {
    const missingId = String(new mongoose.Types.ObjectId());

    await expect(applyViewUpdate(missingId, 1_000)).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(applyViewUpdate(missingId, 1_000)).rejects.toBeInstanceOf(AppError);
  });
});