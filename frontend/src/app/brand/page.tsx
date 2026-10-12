"use client";

import { useCallback, useEffect, useState } from "react";
import CampaignCard from "@/components/brand/CampaignCard";
import CampaignForm from "@/components/brand/CampaignForm";
import Loader from "@/components/common/Loader";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ApiError, api, errorMessage } from "@/lib/api";
import { Campaign } from "@/types";

function BrandDashboard() {
  const { logout } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    api
      .getMyCampaigns()
      .then(({ campaigns }) => {
        if (cancelled) return;
        setCampaigns(campaigns);
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

  return (
    <>
      <div className="page-title">
        <h1>Your campaigns</h1>
        <button className="btn btn-secondary btn-small" onClick={refresh}>
          Refresh
        </button>
      </div>

      <CampaignForm onCreated={(c) => setCampaigns((prev) => [c, ...prev])} />

      {error && <div className="error">{error}</div>}
      {loading ? (
        <Loader />
      ) : campaigns.length === 0 ? (
        <p className="muted">No campaigns yet. Create your first one above.</p>
      ) : (
        campaigns.map((c) => <CampaignCard key={c.id} campaign={c} />)
      )}
    </>
  );
}

export default function BrandPage() {
  return (
    <ProtectedRoute role="brand">
      <BrandDashboard />
    </ProtectedRoute>
  );
}