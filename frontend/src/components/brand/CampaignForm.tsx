"use client";

import { FormEvent, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { Campaign, Platform } from "@/types";
import MilestoneInputs, { MilestoneRow } from "./MilestoneInputs";

export default function CampaignForm({ onCreated }: { onCreated: (c: Campaign) => void }) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [totalBudget, setTotalBudget] = useState("");
  const [rows, setRows] = useState<MilestoneRow[]>([{ views: "", payout: "" }]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { campaign } = await api.createCampaign({
        name,
        platform,
        totalBudget: Number(totalBudget),
        milestones: rows.map((r) => ({
          views: Number(r.views),
          payout: Number(r.payout),
        })),
      });
      onCreated(campaign);
      setName("");
      setTotalBudget("");
      setRows([{ views: "", payout: "" }]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Create a campaign</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Campaign name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="platform">Platform</label>
          <select
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
          >
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="budget">Total budget (INR)</label>
          <input
            id="budget"
            type="number"
            min={1}
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            required
          />
        </div>
        <MilestoneInputs rows={rows} onChange={setRows} />
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create campaign"}
        </button>
      </form>
    </div>
  );
}