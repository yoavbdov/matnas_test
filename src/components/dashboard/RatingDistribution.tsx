// Displays 4 rating-range buckets.
// Admin can click the pencil icon to edit each bucket's label, min, and max.

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { RatingBucketConfig } from "@/firebase/hooks/useRatingThresholds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Bucket {
  label: string;
  count: number;
  onClick?: () => void;
}

interface Props {
  buckets: Bucket[];
  withRating: number;
  withoutRating: number;
  bucketConfigs: RatingBucketConfig[];
  onSaveBuckets: (configs: RatingBucketConfig[]) => Promise<void>;
}

export default function RatingDistribution({
  buckets,
  withRating,
  withoutRating,
  bucketConfigs,
  onSaveBuckets,
}: Props) {
  const [editing, setEditing] = useState(false);
  // Draft copies of the configs while editing
  const [draft, setDraft] = useState<RatingBucketConfig[]>(bucketConfigs);

  function openEditor() {
    setDraft(bucketConfigs); // reset to current saved values
    setEditing(true);
  }

  async function handleSave() {
    await onSaveBuckets(draft);
    setEditing(false);
  }

  function updateDraft(index: number, field: keyof RatingBucketConfig, raw: string) {
    const next = [...draft];
    if (field === "label") {
      next[index] = { ...next[index], label: raw };
    } else {
      // min / max — empty string means "no bound" (null)
      next[index] = { ...next[index], [field]: raw === "" ? null : Number(raw) };
    }
    setDraft(next);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">
          {withRating} שחקנים עם דירוג ישראלי · {withoutRating} ללא דירוג
        </p>
        {!editing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={openEditor}
            title="ערוך טווחי דירוג"
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
          >
            <Pencil size={14} />
          </Button>
        )}
      </div>

      {/* 4 bucket cards — display mode */}
      {!editing && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {buckets.map(({ label, count, onClick }) => (
            <div
              key={label}
              onClick={onClick}
              className={`bg-gray-50 rounded-lg p-3 text-center transition-colors ${
                onClick ? "cursor-pointer hover:bg-teal-50 hover:border hover:border-teal-200" : ""
              }`}
            >
              <p className="text-xl font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Edit mode — each bucket gets its own label/min/max inputs */}
      {editing && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {draft.map((cfg, i) => (
              <BucketEditCard
                key={i}
                config={cfg}
                count={buckets[i]?.count ?? 0}
                onChange={(field, val) => updateDraft(i, field, val)}
              />
            ))}
          </div>

          {/* Save / cancel */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSave}
              size="sm"
              className="gap-1 bg-teal-600 hover:bg-teal-700 text-white text-xs"
            >
              <Check size={13} /> שמור
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
              className="gap-1 text-gray-600 text-xs"
            >
              <X size={13} /> ביטול
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Single bucket card in edit mode ─────────────────────────────────────────

interface BucketEditCardProps {
  config: RatingBucketConfig;
  count: number;
  onChange: (field: keyof RatingBucketConfig, value: string) => void;
}

function BucketEditCard({ config, count, onChange }: BucketEditCardProps) {
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex flex-col gap-2">
      {/* Current count (read-only) */}
      <p className="text-lg font-bold text-gray-700 text-center">{count}</p>

      {/* Label */}
      <Input
        type="text"
        value={config.label}
        onChange={(e) => onChange("label", e.target.value)}
        placeholder="שם הטווח"
        className="w-full text-xs text-center h-7"
      />

      {/* Min / Max */}
      <div className="flex gap-1 items-center text-xs text-gray-500">
        <span>מ:</span>
        <Input
          type="number"
          value={config.min ?? ""}
          onChange={(e) => onChange("min", e.target.value)}
          placeholder="ללא"
          className="w-full text-center text-xs h-7"
        />
      </div>
      <div className="flex gap-1 items-center text-xs text-gray-500">
        <span>עד:</span>
        <Input
          type="number"
          value={config.max ?? ""}
          onChange={(e) => onChange("max", e.target.value)}
          placeholder="ללא"
          className="w-full text-center text-xs h-7"
        />
      </div>
    </div>
  );
}
