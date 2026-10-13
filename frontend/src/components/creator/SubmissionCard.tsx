"use client";

import { FormEvent, useState } from "react";
import StatCard from "@/components/common/StatCard";
import { api, errorMessage } from "@/lib/api";
import { formatINR, formatNumber } from "@/lib/format";
import { Submission } from "@/types";

interface SubmissionCardProps {
  submission: Submission;
  // Called after a successful views update so the dashboard can reload.
  onUpdated?: () => void;
}

export default function SubmissionCard({ submission, onUpdated }: SubmissionCardProps) {
  const [viewsInput, setViewsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    // Mirror the backend rule: views must be a non-negative whole number.
    if (!/^\d+$/.test(viewsInput.trim())) {
      setError("Enter a whole number of views (0 or more).");
      return;
    }
    const views = Number(viewsInput.trim());
    if (!Number.isSafeInteger(views)) {
      setError("That number is too large.");
      return;
    }

    setSaving(true);
    try {
      const result = await api.updateViews(submission.id, views);
      if (result.payoutAdded > 0) {
        setMessage(
          result.budgetCapped
            ? `Paid ${formatINR(result.payoutAdded)}. Campaign budget is now exhausted, so the payout was capped.`
            : `Milestone reached! Paid ${formatINR(result.payoutAdded)}.`
        );
      } else if (result.budgetCapped) {
        setMessage("Views updated, but the campaign budget is exhausted so no payout was added.");
      } else {
        setMessage("Views updated. No new milestone crossed, so no extra payout.");
      }
      setViewsInput("");
      onUpdated?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h3>{submission.campaignName ?? "Campaign"}</h3>
        {submission.platform && <span className="badge">{submission.platform}</span>}
      </div>
      <a className="link" href={submission.postUrl} target="_blank" rel="noreferrer">
        {submission.postUrl}
      </a>
      <div className="stats">
        <StatCard label="Views" value={formatNumber(submission.views)} />
        <StatCard label="Earned" value={formatINR(submission.currentPayout)} />
      </div>

      <form onSubmit={handleSubmit} className="row" style={{ marginTop: 12 }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Simulate total views"
          value={viewsInput}
          onChange={(e) => setViewsInput(e.target.value)}
          disabled={saving}
          aria-label="Simulated total views"
        />
        <button className="btn btn-small" type="submit" disabled={saving}>
          {saving ? "Updating..." : "Simulate views"}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
    </div>
  );
}