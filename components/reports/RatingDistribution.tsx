interface Bucket { label: string; count: number; }

interface Props {
  buckets: Bucket[];
  withRating: number;
  withoutRating: number;
}

export default function RatingDistribution({ buckets, withRating, withoutRating }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs text-gray-400 mb-4">
        {withRating} תלמידים עם דירוג ישראלי · {withoutRating} ללא דירוג
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {buckets.map(({ label, count }) => (
          <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-gray-800">{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
