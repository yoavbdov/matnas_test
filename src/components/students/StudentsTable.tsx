// טבלת השחקנים — מציגה את כל השחקנים המסוננים עם מיון לפי עמודה
import Badge from "@/components/shared/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calcAge, gradeFromDob, formatPhone } from "@/lib/utils/utils";
import { computeStudentStatus } from "@/lib/helpers/studentHelpers";
import type {
  Student,
  Enrollment,
  Tournament,
  LeagueGroup,
  LeagueGroupMember,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/config/config";

export type SortCol =
  | "name" | "age" | "grade" | "rating" | "tournaments" | "league" | "phone" | "classes" | "status";
export type SortDir = "asc" | "desc";

interface Props {
  students: Student[];
  enrollments: Enrollment[];
  tournaments: Tournament[];
  leagueGroups: LeagueGroup[];
  leagueGroupMembers: LeagueGroupMember[];
  onRowClick: (s: Student) => void;
  settings: typeof DEFAULT_SETTINGS;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
}

// כותרת עמודה עם חץ מיון — עוטף shadcn TableHead
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

function statusBadgeColor(status: string): "green" | "blue" | "gray" {
  if (status === "פעיל") return "green";
  if (status === "ליגה בלבד") return "blue";
  return "gray";
}

export default function StudentsTable({
  students, enrollments, tournaments, leagueGroups, leagueGroupMembers,
  onRowClick, settings, sortCol, sortDir, onSort,
}: Props) {
  if (students.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-10 text-center text-sm text-muted-foreground">
        אין שחקנים להצגה
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 text-xs">
            <SortTh label="שם מלא"       col="name"       active={sortCol === "name"}       dir={sortDir} onSort={onSort} />
            <SortTh label="גיל"          col="age"        active={sortCol === "age"}        dir={sortDir} onSort={onSort} />
            <SortTh label="כיתה"         col="grade"      active={sortCol === "grade"}      dir={sortDir} onSort={onSort} />
            <SortTh label="דירוג ישראלי" col="rating"     active={sortCol === "rating"}     dir={sortDir} onSort={onSort} />
            <SortTh label="טלפון"        col="phone"      active={sortCol === "phone"}      dir={sortDir} onSort={onSort} />
            <SortTh label="חוגים"        col="classes"    active={sortCol === "classes"}    dir={sortDir} onSort={onSort} />
            <SortTh label="תחרויות"      col="tournaments" active={sortCol === "tournaments"} dir={sortDir} onSort={onSort} />
            <SortTh label="קבוצת ליגה"  col="league"     active={sortCol === "league"}     dir={sortDir} onSort={onSort} />
            <SortTh label="סטטוס"        col="status"     active={sortCol === "status"}     dir={sortDir} onSort={onSort} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => {
            const age = s.dob ? calcAge(s.dob) : null;
            const grade = s.grade_override
              ? s.grade_override
              : s.dob ? gradeFromDob(s.dob, settings.GRADE_FIRST_AGE, settings.GRADE_ADULT_AGE) : "—";
            const classCount = enrollments.filter((e) => e.student_id === s.id && e.status === "פעיל").length;
            const status = computeStudentStatus(s.id, enrollments, tournaments, leagueGroupMembers);

            return (
              <TableRow key={s.id} onClick={() => onRowClick(s)} className="cursor-pointer">
                <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{age !== null ? `${age}` : "—"}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {s.grade_override && <span title="כיתה ידנית" className="ml-1 text-primary/60">✎</span>}
                  {grade}
                </TableCell>
                <TableCell>
                  {s.israeli_rating ?? "—"}
                  {s.chess_title && <span className="mr-1 text-xs text-primary font-medium">{s.chess_title}</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{s.phone ? formatPhone(s.phone) : "—"}</TableCell>
                <TableCell>{classCount || "—"}</TableCell>
                <TableCell>
                  {(() => {
                    const count = tournaments.filter((t) => t.participant_ids.includes(s.id)).length;
                    return count > 0 ? count : "—";
                  })()}
                </TableCell>
                <TableCell className="text-xs">
                  {(() => {
                    const membership = leagueGroupMembers.find((m) => m.student_id === s.id);
                    if (!membership) return "—";
                    const group = leagueGroups.find((g) => g.id === membership.group_id);
                    return group ? group.name : "—";
                  })()}
                </TableCell>
                <TableCell>
                  <Badge label={status} color={statusBadgeColor(status)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
