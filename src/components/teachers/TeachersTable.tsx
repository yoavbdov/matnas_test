"use client";
// טבלת המדריכים — כל שורה היא מדריך אחד, ניתן למיין לפי כל עמודה
import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import Badge from "@/components/shared/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatPhone } from "@/lib/utils/utils";
import { computeTeacherStatus } from "@/lib/helpers/teacherHelpers";
import type { Teacher, Class, Tournament } from "@/types";

type SortKey = "name" | "phone" | "activeClasses" | "status";
type SortDir = "asc" | "desc";

interface Props {
  teachers: Teacher[];
  classes: Class[];
  tournaments: Tournament[];
  onRowClick: (t: Teacher) => void;
}

function countActiveClasses(teacherId: string, classes: Class[]) {
  return classes.filter((c) => c.teacher_id === teacherId && c.status === "פעיל").length;
}

function sortTeachers(teachers: Teacher[], classes: Class[], tournaments: Tournament[], key: SortKey, dir: SortDir) {
  return [...teachers].sort((a, b) => {
    let valA: string | number = "";
    let valB: string | number = "";
    if (key === "name") { valA = `${a.first_name} ${a.last_name}`; valB = `${b.first_name} ${b.last_name}`; }
    else if (key === "phone") { valA = a.phone ?? ""; valB = b.phone ?? ""; }
    else if (key === "activeClasses") { valA = countActiveClasses(a.id, classes); valB = countActiveClasses(b.id, classes); }
    else if (key === "status") { valA = computeTeacherStatus(a.id, classes, tournaments); valB = computeTeacherStatus(b.id, classes, tournaments); }
    if (valA < valB) return dir === "asc" ? -1 : 1;
    if (valA > valB) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// כותרת עמודה עם כפתור מיון
function SortHeader({ label, sortKey, active, dir, onClick }: {
  label: string; sortKey: SortKey; active: boolean; dir: SortDir; onClick: (key: SortKey) => void;
}) {
  const Icon = active ? (dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <TableHead>
      <Button type="button" variant="ghost" size="sm" onClick={() => onClick(sortKey)}
        className="flex items-center gap-1 -mx-2 hover:text-foreground"
      >
        {label}
        <Icon size={13} className={active ? "text-primary" : "text-muted-foreground/50"} />
      </Button>
    </TableHead>
  );
}

export default function TeachersTable({ teachers, classes, tournaments, onRowClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  if (teachers.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-10 text-center text-sm text-muted-foreground">
        אין מדריכים להצגה
      </div>
    );
  }

  const sorted = sortTeachers(teachers, classes, tournaments, sortKey, sortDir);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <SortHeader label="שם מלא"       sortKey="name"          active={sortKey === "name"}         dir={sortDir} onClick={handleSort} />
            <SortHeader label="טלפון"         sortKey="phone"         active={sortKey === "phone"}        dir={sortDir} onClick={handleSort} />
            <SortHeader label="חוגים פעילים" sortKey="activeClasses" active={sortKey === "activeClasses"} dir={sortDir} onClick={handleSort} />
            <TableHead>הסמכות</TableHead>
            <SortHeader label="סטטוס"         sortKey="status"        active={sortKey === "status"}       dir={sortDir} onClick={handleSort} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((t) => {
            const activeClasses = countActiveClasses(t.id, classes);
            const status = computeTeacherStatus(t.id, classes, tournaments);
            return (
              <TableRow key={t.id} onClick={() => onRowClick(t)} className="cursor-pointer">
                <TableCell className="font-medium">{t.first_name} {t.last_name}</TableCell>
                <TableCell className="text-muted-foreground">{t.phone ? formatPhone(t.phone) : "—"}</TableCell>
                <TableCell>{activeClasses}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(t.certifications ?? []).map((cert) => (
                      <span key={cert} className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{cert}</span>
                    ))}
                    {(t.certifications ?? []).length === 0 && <span className="text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge label={status} color={status === "פעיל" ? "green" : "gray"} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
