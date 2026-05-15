// Displays the list of league groups as a sortable table.
// Clicking a row opens the detail/members modal.

import type { LeagueGroup, LeagueGroupMember } from "@/types";

interface Props {
  groups: LeagueGroup[];
  members: LeagueGroupMember[]; // used to count players per group
  onRowClick: (group: LeagueGroup) => void;
}

export default function LeagueGroupsTable({ groups, members, onRowClick }: Props) {
  if (groups.length === 0) {
    return <p className="text-gray-400 text-sm mt-6 text-center">אין קבוצות ליגה</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-sm text-right">
        <thead className="bg-gray-800 text-gray-300">
          <tr>
            <th className="px-4 py-3 font-medium">שם הקבוצה</th>
            <th className="px-4 py-3 font-medium">תיאור</th>
            <th className="px-4 py-3 font-medium">שחקנים</th>
            <th className="px-4 py-3 font-medium">סטטוס</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {groups.map((group) => {
            // Count how many members belong to this group
            const playerCount = members.filter((m) => m.group_id === group.id).length;

            return (
              <tr
                key={group.id}
                onClick={() => onRowClick(group)}
                className="cursor-pointer bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                  {/* Color dot if a color was set */}
                  {group.color && (
                    <span
                      className="inline-block w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                  )}
                  {group.name}
                </td>
                <td className="px-4 py-3 text-gray-400">{group.description ?? "—"}</td>
                <td className="px-4 py-3 text-gray-300">{playerCount}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      group.status === "פעיל"
                        ? "bg-teal-900 text-teal-300"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {group.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
