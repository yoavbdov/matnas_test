"use client";
// כפתור "בדוק זמינות" אחיד — משמש בטולבר מדריכים וטולבר ציוד
import { CalendarCheck } from "lucide-react";

interface Props {
  onClick: () => void;
  className?: string;
}

export default function CheckAvailabilityBtn({ onClick, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
        border border-gray-300 bg-white text-gray-600 hover:border-teal-400 hover:text-teal-600
        transition-colors cursor-pointer ${className}`}
    >
      <CalendarCheck size={13} />
      בדוק זמינות
    </button>
  );
}
