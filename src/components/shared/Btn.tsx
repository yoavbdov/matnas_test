"use client";
// כפתור אחיד בכל הפרויקט — עוטף את shadcn Button עם ווריאנטים מותאמים
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface BtnProps {
  variant?: Variant;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
  className?: string;
}

// ממפה ווריאנטים פנימיים לווריאנטים של shadcn
const variantMap: Record<Variant, "default" | "outline" | "destructive" | "ghost"> = {
  primary: "default",
  secondary: "outline",
  danger: "destructive",
  ghost: "ghost",
};

export default function Btn({
  variant = "primary",
  onClick,
  disabled,
  loading,
  type = "button",
  children,
  className = "",
}: BtnProps) {
  return (
    <Button
      type={type}
      variant={variantMap[variant]}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
    >
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
