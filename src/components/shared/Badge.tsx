type BadgeColor = "green" | "red" | "gray" | "blue" | "yellow" | "orange" | "purple";

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

const colorMap: Record<BadgeColor, string> = {
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  gray: "bg-gray-100 text-gray-600",
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
};

export default function Badge({ label, color = "gray" }: BadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[color]}`}>
      {label}
    </span>
  );
}
