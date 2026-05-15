// כפתור טאב — משמש בדף תחרויות ואירועים
import { Button } from "@/components/ui/button";

interface TabBtnProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function TabBtn({ label, active, onClick }: TabBtnProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      onClick={onClick}
      className={`rounded-t-lg rounded-b-none border-b-2 ${
        active ? "border-primary" : "border-transparent"
      }`}
    >
      {label}
    </Button>
  );
}
