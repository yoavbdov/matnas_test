"use client";
// כפתור העלאת CSV אחיד — אפור עם אייקון Upload
// משמש בכל המודולים: תלמידים, מדריכים, חוגים, חדרים
import { Upload } from "lucide-react";

interface Props {
  onClick: () => void;
  className?: string;
}

export default function CsvImportBtn({ onClick, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
        bg-green-600 hover:bg-green-700 text-white transition-colors cursor-pointer ${className}`}
    >
      <Upload size={13} />
      העלאת מידע דרך CSV
    </button>
  );
}
