"use client";
// כפתור "בדוק זמינות" אחיד — משמש בטולבר מדריכים וטולבר ציוד
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClick: () => void;
  className?: string;
}

export default function CheckAvailabilityBtn({ onClick, className = "" }: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={`gap-1.5 text-xs font-medium text-gray-600 hover:border-teal-400 hover:text-teal-600 ${className}`}
    >
      <CalendarCheck size={13} />
      בדוק זמינות
    </Button>
  );
}
