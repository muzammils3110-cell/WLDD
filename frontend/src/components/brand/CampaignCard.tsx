import { ReactNode } from "react";
import StatCard from "@/components/common/StatCard";
import { formatINR, formatNumber } from "@/lib/format";
import { Campaign } from "@/types";

export default function CampaignCard({
  campaign,
  actions,
}: {
  campaign: Campaign;
  actions?: ReactNode;
}) {
  const percentSpent =
    campaign.totalBudget > 0
      ? Math.min(100, (campaign.spentBudget / campaign.totalBudget) * 100)
      : 0;

  return (
    <div className="card">
      <div className="card-head">
        <h3>{campaign.name}</h3>
        <span className="badge">{campaign.platform}</span>
      </div>

      <div className="progress" title={`${percentSpent.toFixed(0)}% spent`}>
        <div style={{ width: `${percentSpent}%` }} />
      </div>

      <div className="stats">
        <StatCard label="Total budget" value={formatINR(campaign.totalBudget)} />
        <StatCard label="Spent" value={formatINR(campaign.spentBudget)} />
        <StatCard label="Remaining" value={formatINR(campaign.remainingBudget)} />
      </div>

      <div className="muted">Milestones</div>
      <ul className="ladder">
        {campaign.milestones.map((m) => (
          <li key={m.views}>
            {formatNumber(m.views)} views → {formatINR(m.payout)}
          </li>
        ))}
      </ul>

      {actions && <div style={{ marginTop: 12 }}>{actions}</div>}
    </div>
  );
}