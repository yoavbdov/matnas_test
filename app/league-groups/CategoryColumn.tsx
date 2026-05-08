// Single column in the league groups page.
// Shows all groups for one category (בוגרים / נוער / נשים), sorted by league tier.

import type { LeagueGroup, LeagueGroupMember, LeagueType } from "@/lib/types";

// Display order for each possible tier (lower index = lower tier)
const TIER_ORDER: LeagueType[] = ["ג", "ב", "א", "מחוזית", "ארצית", "לאומית", "עילית"];

interface Props {
  title: string;
  groups: LeagueGroup[];
  members: LeagueGroupMember[];
  onRowClick: (group: LeagueGroup) => void;
}

export default function CategoryColumn({ title, groups, members, onRowClick }: Props) {
  // Sort groups by league tier — highest first (reversed index)
  const sorted = [...groups].sort(
    (a, b) => TIER_ORDER.indexOf(b.leagueType) - TIER_ORDER.indexOf(a.leagueType)
  );

  return (
    <div className="flex flex-col gap-3 items-center">
      {/* Column header — centered */}
      <div className="flex items-center gap-2 justify-center">
        <h2 className="text-base font-bold text-teal-300">{title}</h2>
        <span className="bg-gray-700 text-gray-200 text-xs font-semibold px-2 py-0.5 rounded-full">
          {groups.length}
        </span>
      </div>

      {/* Group cards */}
      {sorted.length === 0 ? (
        <p className="text-gray-400 text-sm mt-2">אין קבוצות</p>
      ) : (
        <div className="flex flex-col gap-2 w-full">
          {sorted.map((group) => {
            const playerCount = members.filter((m) => m.group_id === group.id).length;
            return (
              <GroupCard
                key={group.id}
                group={group}
                playerCount={playerCount}
                onClick={() => onRowClick(group)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── GroupCard ────────────────────────────────────────────────────────────────
// A single clickable card for one league group.

interface CardProps {
  group: LeagueGroup;
  playerCount: number;
  onClick: () => void;
}

function GroupCard({ group, playerCount, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-center bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-teal-500 rounded-lg px-4 py-3 transition-colors cursor-pointer"
    >
      {/* Name + status badge */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="font-semibold text-teal-100 text-sm truncate">{group.name}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            group.status === "פעיל"
              ? "bg-teal-900 text-teal-200"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {group.status}
        </span>
      </div>

      {/* League type + player count */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-300 mt-1">
        <span>ליגה: <strong className="text-white">{group.leagueType}</strong></span>
        <span>{playerCount} שחקנים</span>
      </div>

      {/* Description if set */}
      {group.description && (
        <p className="text-xs text-gray-400 mt-1 truncate">{group.description}</p>
      )}
    </button>
  );
}
