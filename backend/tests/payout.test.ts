import { calculatePayout } from "../src/lib/payout";

const ladder = [
  { views: 10_000, payout: 500 },
  { views: 50_000, payout: 2_000 },
  { views: 100_000, payout: 5_000 },
];

const base = { milestones: ladder, currentPayout: 0, remainingBudget: 100_000 };

describe("calculatePayout - milestones", () => {
  it("pays nothing below the first milestone", () => {
    const r = calculatePayout({ ...base, views: 9_999 });
    expect(r.increment).toBe(0);
    expect(r.newPayout).toBe(0);
  });

  it("pays when views exactly equal a threshold", () => {
    const r = calculatePayout({ ...base, views: 10_000 });
    expect(r.increment).toBe(500);
  });

  it("pays only the highest milestone when several are crossed at once", () => {
    const r = calculatePayout({ ...base, views: 120_000 });
    expect(r.milestonePayout).toBe(5_000);
    expect(r.increment).toBe(5_000);
    expect(r.newPayout).toBe(5_000);
  });

  it("pays only the difference when a creator moves up a milestone", () => {
    const r = calculatePayout({ ...base, views: 60_000, currentPayout: 500 });
    expect(r.increment).toBe(1_500);
    expect(r.newPayout).toBe(2_000);
  });

  it("handles an unsorted ladder", () => {
    const r = calculatePayout({
      ...base,
      milestones: [ladder[2], ladder[0], ladder[1]],
      views: 55_000,
    });
    expect(r.newPayout).toBe(2_000);
  });
});

describe("calculatePayout - idempotency and view changes", () => {
  it("does not pay again for the same view count", () => {
    const first = calculatePayout({ ...base, views: 60_000 });
    const second = calculatePayout({
      ...base,
      views: 60_000,
      currentPayout: first.newPayout,
      remainingBudget: 100_000 - first.increment,
    });
    expect(second.increment).toBe(0);
    expect(second.newPayout).toBe(first.newPayout);
  });

  it("never claws back when views decrease", () => {
    const r = calculatePayout({ ...base, views: 5_000, currentPayout: 2_000 });
    expect(r.increment).toBe(0);
    expect(r.newPayout).toBe(2_000);
  });
});

describe("calculatePayout - budget cap", () => {
  it("caps the payout at the remaining budget", () => {
    const r = calculatePayout({ ...base, views: 120_000, remainingBudget: 300 });
    expect(r.increment).toBe(300);
    expect(r.newPayout).toBe(300);
    expect(r.capped).toBe(true);
  });

  it("pays in full when the budget exactly covers the increment", () => {
    const r = calculatePayout({ ...base, views: 120_000, remainingBudget: 5_000 });
    expect(r.increment).toBe(5_000);
    expect(r.capped).toBe(false);
  });

  it("pays nothing when the budget is exhausted", () => {
    const r = calculatePayout({ ...base, views: 120_000, remainingBudget: 0 });
    expect(r.increment).toBe(0);
    expect(r.capped).toBe(true);
  });

  it("treats a negative remaining budget as zero", () => {
    const r = calculatePayout({ ...base, views: 120_000, remainingBudget: -50 });
    expect(r.increment).toBe(0);
  });

  it("caps the incremental amount, not the full milestone payout", () => {
    const r = calculatePayout({
      ...base,
      views: 120_000,
      currentPayout: 2_000,
      remainingBudget: 1_000,
    });
    expect(r.increment).toBe(1_000);
    expect(r.newPayout).toBe(3_000);
  });
});

describe("calculatePayout - validation", () => {
  it("rejects negative views", () => {
    expect(() => calculatePayout({ ...base, views: -1 })).toThrow();
  });

  it("rejects non-finite views", () => {
    expect(() => calculatePayout({ ...base, views: NaN })).toThrow();
    expect(() => calculatePayout({ ...base, views: Infinity })).toThrow();
  });
});