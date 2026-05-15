// שדה חיפוש אחיד עם אייקון זכוכית מגדלת — משמש בכל הפרויקט
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LIMITS } from "@/lib/validation/validators";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function SearchInput({ value, onChange, placeholder = "חיפוש...", autoFocus, className }: Props) {
  return (
    <div className={`relative ${className ?? "flex-1 max-w-xs"}`}>
      {/* אייקון חיפוש ממוקם בצד ימין (RTL) */}
      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, LIMITS.SEARCH))}
        maxLength={LIMITS.SEARCH}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pr-8"
      />
    </div>
  );
}
