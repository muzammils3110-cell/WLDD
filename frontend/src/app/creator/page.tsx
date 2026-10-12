"use client";

import { useCallback, useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import StatCard from "@/components/common/StatCard";
import CampaignList from "@/components/creator/CampaignList";
import SubmissionCard from "@/components/creator/SubmissionCard";
import SubmitPostForm from "@/components/creator/SubmitPostForm";
import { useAuth } from "@/context/AuthContext";
import { ApiError, api, errorMessage } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { Campaign, Submission } from "@/types";

function CreatorDashboard() {
  const { logout } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.getLiveCampaigns(), api.getMySubmissions()])
      .then(([live, mine]) => {
        if (cancelled) return;
        setCampaigns(live.campaigns);
        setSubmissions(mine.submissions);
        setTotalEarnings(mine.totalEarnings);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout]);

  function handleSelect(id: string) {
    setSelectedId(id);
    document.getElementById("submit-form")?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) return <Loader />;

  return (
    <>
      <div className="page-title">
        <h1>Creator dashboard</h1>
        <button className="btn btn-secondary btn-small" onClick={refresh}>
          Refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="stats">
          <StatCard label="Total earnings" value={formatINR(totalEarnings)} />
          <StatCard label="Posts submitted" value={String(submissions.length)} />
        </div>
      </div>

      <SubmitPostForm
        campaigns={campaigns}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onSubmitted={refresh}
      />

      <h2>My submissions</h2>
      {submissions.length === 0 ? (
        <p className="muted">You haven&apos;t submitted any posts yet.</p>
      ) : (
        submissions.map((s) => <SubmissionCard key={s.id} submission={s} />)
      )}

      <h2>Live campaigns</h2>
      <CampaignList campaigns={campaigns} onSelect={handleSelect} />
    </>
  );
}

export default function CreatorPage() {
  return (
    <ProtectedRoute role="creator">
      <CreatorDashboard />
    </ProtectedRoute>
  );
}