"use client";
// כפתור ייבוא CSV — ירוק עם אייקון Upload, עוטף shadcn Button
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClick: () => void;
  className?: string;
}

export default function CsvImportBtn({ onClick, className = "" }: Props) {
  return (
    <Button
      type="button"
      onClick={onClick}
      size="sm"
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
    >
      <Upload size={13} />
      העלאת מידע דרך CSV
    </Button>
  );
}
