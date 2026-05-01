// כרטיס מפגש בלוח זמנים שבועי — מציג שם חוג, שעות, מדריך וחדר
import type { Class, Teacher, Room, ScheduleSlot } from "@/lib/types";

interface Props {
  classItem: Class;
  slot: ScheduleSlot;
  teacher?: Teacher;
  room?: Room;
  enrollCount: number;
  hasConflict?: boolean;
  onClick?: () => void;
}

export default function ScheduleCard({ classItem, slot, teacher, room, enrollCount, hasConflict, onClick }: Props) {
  const ratio = classItem.capacity > 0 ? enrollCount / classItem.capacity : 0;
  const nearFull = ratio >= 0.8;
  const full = ratio >= 1;

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-2 text-white text-xs transition-opacity hover:opacity-90 ${
        onClick ? "cursor-pointer" : ""
      } ${hasConflict ? "ring-2 ring-red-400 ring-offset-1" : ""}`}
      style={{ background: classItem.color ?? "#14b8a6" }}
    >
      {/* Class name */}
      <p className="font-semibold truncate">{classItem.name}</p>

      {/* Time */}
      <p className="opacity-90">{slot.start_time}–{slot.end_time}</p>

      {/* Teacher */}
      {teacher && (
        <p className="opacity-80 truncate">{teacher.first_name} {teacher.last_name}</p>
      )}

      {/* Room */}
      {room && <p className="opacity-80 truncate">{room.name}</p>}

      {/* Enrollment indicator */}
      <p className={`opacity-90 text-[10px] mt-0.5 ${full ? "font-bold" : nearFull ? "font-medium" : ""}`}>
        {enrollCount}/{classItem.capacity}
        {full ? " • מלא" : nearFull ? " • כמעט מלא" : ""}
      </p>

      {/* Conflict badge */}
      {hasConflict && (
        <p className="text-[10px] font-bold mt-0.5">⚠ קונפליקט</p>
      )}
    </div>
  );
}
