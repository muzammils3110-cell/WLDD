"use client";

import { FormEvent, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { Campaign, Submission } from "@/types";

export default function SubmitPostForm({
  campaigns,
  selectedId,
  onSelect,
  onSubmitted,
}: {
  campaigns: Campaign[];
  selectedId: string;
  onSelect: (id: string) => void;
  onSubmitted: (s: Submission) => void;
}) {
  const [postUrl, setPostUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const { submission } = await api.createSubmission(selectedId, postUrl);
      onSubmitted(submission);
      setPostUrl("");
      setSuccess("Post submitted. Your views and earnings will appear below.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card" id="submit-form">
      <h2>Submit a post</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="campaign">Campaign</label>
          <select
            id="campaign"
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            required
          >
            <option value="" disabled>
              Select a campaign
            </option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.platform})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="postUrl">Post link</label>
          <input
            id="postUrl"
            type="url"
            placeholder="https://www.instagram.com/reel/..."
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            required
          />
        </div>
        <button className="btn" type="submit" disabled={submitting || !selectedId}>
          {submitting ? "Submitting..." : "Submit post"}
        </button>
      </form>
    </div>
  );
}