import StatCard from "@/components/common/StatCard";
import { formatINR, formatNumber } from "@/lib/format";
import { Submission } from "@/types";

export default function SubmissionCard({ submission }: { submission: Submission }) {
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
    </div>
  );
}