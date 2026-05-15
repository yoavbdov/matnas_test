"use client";
// כרטיס סטטיסטיקה — עוטף shadcn Card עם אייקון וערך
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  sub?: string;
  onClick?: () => void;
  color?: "teal" | "indigo" | "orange" | "red";
}

const colorMap = {
  teal: "bg-teal-50 text-teal-600",
  indigo: "bg-indigo-50 text-indigo-600",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-red-50 text-red-600",
};

export default function StatCard({ icon: Icon, value, label, sub, onClick, color = "teal" }: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
          {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
