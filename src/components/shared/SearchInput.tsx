// שדה חיפוש אחיד עם אייקון זכוכית מגדלת והגבלת תווים
// משמש בכל סרגלי הכלים ובחלונות קופצים בפרויקט
import { Search } from "lucide-react";
import { LIMITS } from "@/lib/validation/validators";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  // מאפשר התאמת רוחב/עיצוב חיצוני (ברירת מחדל: flex-1 max-w-xs)
  className?: string;
}

export default function SearchInput({ value, onChange, placeholder = "חיפוש...", autoFocus, className }: Props) {
  return (
    <div className={`relative ${className ?? "flex-1 max-w-xs"}`}>
      {/* אייקון חיפוש — ממוקם בצד ימין (RTL) */}
      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, LIMITS.SEARCH))}
        maxLength={LIMITS.SEARCH}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full border border-gray-200 rounded-lg pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
      />
    </div>
  );
}
