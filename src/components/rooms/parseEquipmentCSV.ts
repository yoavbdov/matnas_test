// ניתוח קובץ CSV לייבוא ציוד

export interface ParsedEquipmentRow {
  lineNum: number;
  name?: string;
  quantity?: number;
  notes?: string;
  errors: string[];
}

export const EQUIPMENT_TEMPLATE_HEADERS = ["שם*", "כמות*", "הערות"];
export const EQUIPMENT_TEMPLATE_EXAMPLE = ["לוחות שחמט", "20", "לוחות עץ"];

export function parseEquipmentCSV(text: string): ParsedEquipmentRow[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  return lines.slice(1).map((line, i) => {
    const cols = line.split(/,|;/).map((c) => {
      const t = c.trim();
      if (/^=".*"$/.test(t)) return t.slice(2, -1);
      return t.replace(/^"|"$/g, "");
    });

    const [nameRaw, quantityRaw, notes] = cols;
    const errors: string[] = [];

    if (!nameRaw?.trim()) errors.push("שם חסר");

    let quantity: number | undefined;
    if (!quantityRaw?.trim()) {
      errors.push("כמות חסרה");
    } else {
      const n = Number(quantityRaw.trim());
      if (isNaN(n) || n < 0) errors.push("כמות חייבת להיות מספר חיובי");
      else quantity = Math.round(n);
    }

    return {
      lineNum: i + 2,
      name: nameRaw?.trim() || undefined,
      quantity,
      notes: notes?.trim() || undefined,
      errors,
    };
  });
}
