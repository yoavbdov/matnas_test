"use client";
// טבלת המדריכים — כל שורה היא מדריך אחד, ניתן למיין לפי כל עמודה
// סטטוס נגזר אוטומטית: 0 חוגים פעילים = לא פעיל
import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import Badge from "@/components/shared/Badge";
import type { Teacher, Class } from "@/lib/types";

type SortKey = "name" | "phone" | "activeClasses" | "status";
type SortDir = "asc" | "desc";

interface Props {
  teachers: Teacher[];
  classes: Class[];
  onRowClick: (t: Teacher) => void;
}

function countActiveClasses(teacherId: string, classes: Class[]) {
  return classes.filter((c) => c.teacher_id === teacherId && c.status === "פעיל").length;
}

// אם למדריך 0 חוגים פעילים — הוא נחשב לא פעיל
function effectiveStatus(teacher: Teacher, activeClasses: number): "פעיל" | "לא פעיל" {
  return activeClasses === 0 ? "לא פעיל" : teacher.status;
}

function sortTeachers(teachers: Teacher[], classes: Class[], key: SortKey, dir: SortDir) {
  return [...teachers].sort((a, b) => {
    const acA = countActiveClasses(a.id, classes);
    const acB = countActiveClasses(b.id, classes);
    let valA: string | number = "";
    let valB: string | number = "";

    if (key === "name") {
      valA = `${a.first_name} ${a.last_name}`;
      valB = `${b.first_name} ${b.last_name}`;
    } else if (key === "phone") {
      valA = a.phone ?? "";
      valB = b.phone ?? "";
    } else if (key === "activeClasses") {
      valA = acA;
      valB = acB;
    } else if (key === "status") {
      valA = effectiveStatus(a, acA);
      valB = effectiveStatus(b, acB);
    }

    if (valA < valB) return dir === "asc" ? -1 : 1;
    if (valA > valB) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function SortHeader({ label, sortKey, active, dir, onClick }: {
  label: string;
  sortKey: SortKey;
  active: boolean;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const Icon = active ? (dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th className="text-right px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className="flex items-center gap-1 hover:text-teal-600 transition-colors"
      >
        {label}
        <Icon size={13} className={active ? "text-teal-500" : "text-gray-300"} />
      </button>
    </th>
  );
}

export default function TeachersTable({ teachers, classes, onRowClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (teachers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-400">
        אין מדריכים להצגה
      </div>
    );
  }

  const sorted = sortTeachers(teachers, classes, sortKey, sortDir);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
            <SortHeader label="שם מלא"        sortKey="name"          active={sortKey === "name"}         dir={sortDir} onClick={handleSort} />
            <SortHeader label="טלפון"          sortKey="phone"         active={sortKey === "phone"}        dir={sortDir} onClick={handleSort} />
            <SortHeader label="חוגים פעילים"  sortKey="activeClasses" active={sortKey === "activeClasses"} dir={sortDir} onClick={handleSort} />
            <th className="text-right px-4 py-3 font-medium">הסמכות</th>
            <SortHeader label="סטטוס"          sortKey="status"        active={sortKey === "status"}       dir={sortDir} onClick={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => {
            const activeClasses = countActiveClasses(t.id, classes);
            const status = effectiveStatus(t, activeClasses);
            return (
              <tr
                key={t.id}
                onClick={() => onRowClick(t)}
                className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-800">{t.first_name} {t.last_name}</td>
                <td className="px-4 py-3 text-gray-500">{t.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{activeClasses}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(t.certifications ?? []).map((cert) => (
                      <span key={cert} className="text-xs bg-teal-50 text-teal-700 rounded-full px-2 py-0.5">
                        {cert}
                      </span>
                    ))}
                    {(t.certifications ?? []).length === 0 && <span className="text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge label={status} color={status === "פעיל" ? "green" : "gray"} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
