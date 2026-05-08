"use client";
// Two dropdowns (HH and MM) for 24-hour time selection — no AM/PM
// Value format: "HH:MM" (e.g. "09:30")

const HOURS = Array.from({ length: 25 }, (_, i) => String(i).padStart(2, "0")); // 00–24
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")); // 00–59

interface Props {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  className?: string;
}

export default function TimeSelect({ value, onChange, className }: Props) {
  const [hh, mm] = value.split(":") ?? ["09", "00"];

  return (
    // dir="ltr" forces HH on the left and MM on the right regardless of page RTL
    <div className="flex items-center gap-1" dir="ltr">
      {/* Hour dropdown */}
      <select
        className={className}
        value={hh}
        onChange={(e) => onChange(`${e.target.value}:${mm}`)}
      >
        {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>

      {/* Styled colon separator */}
      <span className="text-teal-500 font-bold text-lg leading-none select-none">:</span>

      {/* Minute dropdown */}
      <select
        className={className}
        value={mm}
        onChange={(e) => onChange(`${hh}:${e.target.value}`)}
      >
        {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
}
