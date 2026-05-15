"use client";
// כפתור ייצוא CSV אחיד — ירוק עם אייקון Download
// משמש בכל המודולים: תלמידים, מדריכים, חוגים, חדרים, נוכחות
import { Download } from "lucide-react";

interface Props {
  onClick: () => void;
  className?: string;
}

export default function CsvExportBtn({ onClick, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
        bg-green-600 hover:bg-green-700 text-white transition-colors cursor-pointer ${className}`}
    >
      <Download size={13} />
      ייצוא מידע לCSV
    </button>
  );
}
