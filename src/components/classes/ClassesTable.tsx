// טבלת החוגים — כל שורה היא חוג אחד, כל כותרת עמודה ניתנת למיון
import Badge from "@/components/shared/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Class, Teacher, Enrollment } from "@/types";

export type SortCol = "name" | "teacher" | "enrolled" | "capacity" | "days" | "status";
export type SortDir = "asc" | "desc";

interface Props {
  classes: Class[];
  teachers: Teacher[];
  enrollments: Enrollment[];
  onRowClick: (c: Class) => void;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
}

// כותרת עמודה עם חץ מיון
function SortTh({ label, col, active, dir, onSort }: {
  label: string; col: SortCol; active: boolean; dir: SortDir; onSort: (col: SortCol) => void;
}) {
  return (
    <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => onSort(col)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-muted-foreground">{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </span>
    </TableHead>
  );
}

function enrollColor(ratio: number) {
  if (ratio >= 1) return "text-red-600 font-semibold";
  if (ratio >= 0.8) return "text-orange-500 font-medium";
  return "text-primary";
}

export default function ClassesTable({ classes, teachers, enrollments, onRowClick, sortCol, sortDir, onSort }: Props) {
  if (classes.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-10 text-center text-sm text-muted-foreground">
        אין חוגים להצגה
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 text-xs">
            {/* עמודת נקודת צבע */}
            <TableHead className="w-4" />
            <SortTh label="שם החוג"  col="name"     active={sortCol === "name"}     dir={sortDir} onSort={onSort} />
            <SortTh label="מדריך"    col="teacher"  active={sortCol === "teacher"}  dir={sortDir} onSort={onSort} />
            <TableHead>גילאים</TableHead>
            <TableHead>דירוגים</TableHead>
            <SortTh label="רשומים"   col="enrolled" active={sortCol === "enrolled"} dir={sortDir} onSort={onSort} />
            <SortTh label="קיבולת"   col="capacity" active={sortCol === "capacity"} dir={sortDir} onSort={onSort} />
            <SortTh label="ימים"     col="days"     active={sortCol === "days"}     dir={sortDir} onSort={onSort} />
            <SortTh label="סטטוס"    col="status"   active={sortCol === "status"}   dir={sortDir} onSort={onSort} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((cls) => {
            const teacher = teachers.find((t) => t.id === cls.teacher_id);
            const enrolled = enrollments.filter((e) => e.class_id === cls.id && e.status === "פעיל").length;
            const ratio = cls.capacity > 0 ? enrolled / cls.capacity : 0;
            const days = [...new Set((cls.slots ?? []).map((s) => s.day))].join(", ");

            return (
              <TableRow key={cls.id} onClick={() => onRowClick(cls)} className="cursor-pointer">
                <TableCell>
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: cls.color ?? "#ccc" }} />
                </TableCell>
                <TableCell className="font-medium">{cls.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {teacher ? `${teacher.first_name} ${teacher.last_name}` : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {cls.age_min !== undefined && cls.age_max !== undefined ? `${cls.age_min}–${cls.age_max}` : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {cls.rating_min !== undefined && cls.rating_max !== undefined ? `${cls.rating_min}–${cls.rating_max}` : "—"}
                </TableCell>
                <TableCell className={enrollColor(ratio)}>{enrolled}</TableCell>
                <TableCell className="text-muted-foreground">{cls.capacity}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{days || "—"}</TableCell>
                <TableCell>
                  <Badge
                    label={cls.status}
                    color={
                      cls.status === "פעיל" ? "green" :
                      cls.status === "מתוכנן" ? "blue" :
                      cls.status === "הסתיים" ? "gray" :
                      "red"
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
