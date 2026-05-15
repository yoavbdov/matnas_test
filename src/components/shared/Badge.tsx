// תג סטטוס — עוטף shadcn Badge עם צבעים מותאמים ל-RTL
import { Badge as ShadcnBadge } from "@/components/ui/badge";

type BadgeColor = "green" | "red" | "gray" | "blue" | "yellow" | "orange" | "purple";

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

// shadcn Badge אינו תומך בצבעים מותאמים — מחילים className ידנית
const colorMap: Record<BadgeColor, string> = {
  green: "bg-green-100 text-green-700 border-green-200",
  red: "bg-red-100 text-red-700 border-red-200",
  gray: "bg-gray-100 text-gray-600 border-gray-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function Badge({ label, color = "gray" }: BadgeProps) {
  return (
    <ShadcnBadge variant="outline" className={colorMap[color]}>
      {label}
    </ShadcnBadge>
  );
}
