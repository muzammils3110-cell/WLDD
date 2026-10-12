"use client";

export interface MilestoneRow {
  views: string;
  payout: string;
}

export default function MilestoneInputs({
  rows,
  onChange,
}: {
  rows: MilestoneRow[];
  onChange: (rows: MilestoneRow[]) => void;
}) {
  function update(index: number, field: keyof MilestoneRow, value: string) {
    onChange(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  return (
    <div className="field">
      <label>Milestone ladder (views → payout in INR)</label>
      {rows.map((row, i) => (
        <div className="row" key={i}>
          <input
            type="number"
            min={1}
            placeholder="Views, e.g. 10000"
            value={row.views}
            onChange={(e) => update(i, "views", e.target.value)}
          />
          <input
            type="number"
            min={1}
            placeholder="Payout, e.g. 500"
            value={row.payout}
            onChange={(e) => update(i, "payout", e.target.value)}
          />
          <button
            type="button"
            className="btn btn-secondary btn-small"
            disabled={rows.length === 1}
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => onChange([...rows, { views: "", payout: "" }])}
        >
          + Add milestone
        </button>
      </div>
    </div>
  );
}