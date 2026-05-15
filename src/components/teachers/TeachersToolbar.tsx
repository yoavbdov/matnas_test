"use client";
// סרגל כלים מעל טבלת המדריכים
import { Plus } from "lucide-react";
import Btn from "@/components/shared/Btn";
import CsvExportBtn from "@/components/shared/CsvExportBtn";
import CsvImportBtn from "@/components/shared/CsvImportBtn";
import CheckAvailabilityBtn from "@/components/shared/CheckAvailabilityBtn";
import SearchInput from "@/components/shared/SearchInput";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  statusFilter: "הכל" | "פעיל" | "לא פעיל";
  onFilterStatus: (v: "הכל" | "פעיל" | "לא פעיל") => void;
  onAddTeacher: () => void;
  onCheckAvailability: () => void;
  onExport: () => void;
  onImport: () => void;
}

export default function TeachersToolbar({
  search, onSearch, statusFilter, onFilterStatus, onAddTeacher, onCheckAvailability, onExport, onImport,
}: Props) {
  return (
    <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2 flex-1">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="חיפוש לפי שם, אימייל, טלפון…"
        />
        <Select
          value={statusFilter}
          onValueChange={(v: string) => onFilterStatus(v as typeof statusFilter)}
        >
          <SelectTrigger className="text-sm h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["הכל", "פעיל", "לא פעיל"] as const).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <CheckAvailabilityBtn onClick={onCheckAvailability} />
        <CsvImportBtn onClick={onImport} />
        <CsvExportBtn onClick={onExport} />
        <Btn onClick={onAddTeacher}>
          <Plus size={15} />הוסף מדריך
        </Btn>
      </div>
    </div>
  );
}
