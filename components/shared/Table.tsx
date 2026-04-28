"use client";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  sortable?: boolean;
}

export default function Table<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  sortable = false,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(key: string) {
    if (!sortable) return;
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey];
        const bv = (b as Record<string, unknown>)[sortKey];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), "he");
        return sortAsc ? cmp : -cmp;
      })
    : rows;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {sorted.length === 0 ? (
        <div className="p-10 text-center text-sm text-gray-400">אין נתונים להצגה</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`text-right px-4 py-3 font-medium select-none ${sortable ? "cursor-pointer hover:text-gray-700" : ""}`}
                  onClick={() => handleSort(String(col.key))}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortable && sortKey === String(col.key) && (
                      sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-gray-50 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 text-gray-700">
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
