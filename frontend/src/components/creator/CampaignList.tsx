import CampaignCard from "@/components/brand/CampaignCard";
import { Campaign } from "@/types";

export default function CampaignList({
  campaigns,
  onSelect,
}: {
  campaigns: Campaign[];
  onSelect: (campaignId: string) => void;
}) {
  if (campaigns.length === 0) {
    return <p className="muted">No live campaigns right now.</p>;
  }

  return (
    <>
      {campaigns.map((c) => (
        <CampaignCard
          key={c.id}
          campaign={c}
          actions={
            <button className="btn btn-small" onClick={() => onSelect(c.id)}>
              Submit a post
            </button>
          }
        />
      ))}
    </>
  );
}