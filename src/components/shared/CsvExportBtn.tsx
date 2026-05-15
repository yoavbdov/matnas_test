"use client";
// כפתור ייצוא CSV — ירוק עם אייקון Download, עוטף shadcn Button
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClick: () => void;
  className?: string;
}

export default function CsvExportBtn({ onClick, className = "" }: Props) {
  return (
    <Button
      type="button"
      onClick={onClick}
      size="sm"
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
    >
      <Download size={13} />
      ייצוא מידע לCSV
    </Button>
  );
}
