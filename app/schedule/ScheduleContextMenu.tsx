"use client";
// תפריט הקשר שנפתח בלחיצה ימנית על אירוע בלוח הזמנים.
// מציג שתי אפשרויות מחיקה: מפגש נוכחי בלבד, או את כל האירועים.
import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export interface ContextMenuTarget {
  x: number;          // מיקום X של העכבר
  y: number;          // מיקום Y של העכבר
  label: string;      // שם האירוע להצגה בהודעת האישור
  dateStr: string;    // התאריך הנוכחי של המפגש (YYYY-MM-DD)
  isRecurring: boolean; // האם האירוע חוזר (מציג שתי אפשרויות שונות)
  onDeleteSingle: () => Promise<void>; // מחק מפגש נוכחי בלבד
  onDeleteAll: () => Promise<void>;    // מחק את כל האירועים
}

interface Props {
  target: ContextMenuTarget;
  onClose: () => void;
}

type PendingAction = "single" | "all" | null;

export default function ScheduleContextMenu({ target, onClose }: Props) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [visible, setVisible] = useState(false); // מנהל את ה-transition
  const menuRef = useRef<HTMLDivElement>(null);

  // Slide-in לאחר mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // סגירה בלחיצה על Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // סגירה בלחיצה מחוץ לתפריט — אבל לא כשה-ConfirmDialog פתוח
  // (pendingAction מגן מפני סגירה מוקדמת לפני שהאישור מסתיים)
  const pendingActionRef = useRef<PendingAction>(null);
  pendingActionRef.current = pendingAction;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pendingActionRef.current) return; // ConfirmDialog פתוח — אל תסגור
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // setTimeout כדי לא לסגור מיד מהלחיצה שפתחה את התפריט
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [onClose]);

  async function handleConfirm() {
    if (pendingAction === "single") await target.onDeleteSingle();
    else if (pendingAction === "all") await target.onDeleteAll();
    setPendingAction(null);
    onClose();
  }

  // הצג הודעת אישור בהתאם לפעולה
  const confirmMessage = pendingAction === "single"
    ? `למחוק את המפגש של "${target.label}" בתאריך ${target.dateStr}?`
    : `למחוק את כל המפגשים של "${target.label}"? פעולה זו אינה הפיכה.`;

  // הקצה הימני-עליון של התפריט יהיה בנקודת העכבר (transform מזיז שמאלה ב-100%)
  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: target.y,
    left: target.x,
    transform: "translateX(-100%)",
    zIndex: 9999,
    maxWidth: "220px",
  };

  return (
    <>
      {/* שכבת רקע — נחסמת כשה-ConfirmDialog פתוח כדי שכפתוריו יהיו לחיצים */}
      {!pendingAction && (
        <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      )}

      {/* התפריט עצמו */}
      <div
        ref={menuRef}
        style={menuStyle}
        className={`bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden
          transition-all duration-150 origin-top-right
          ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        dir="rtl"
      >
        {/* כותרת — שם האירוע */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 truncate">{target.label}</p>
        </div>

        {/* אפשרות 1: מחק מפגש נוכחי */}
        <button
          onClick={() => setPendingAction("single")}
          className="w-full text-right px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
        >
          <span className="text-base">🗓</span>
          <span>מחק מפגש נוכחי</span>
        </button>

        {/* מחיצה */}
        <div className="border-t border-gray-100" />

        {/* אפשרות 2: מחק את כל האירועים */}
        <button
          onClick={() => setPendingAction("all")}
          className="w-full text-right px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors flex items-center gap-2"
        >
          <span className="text-base">🗑</span>
          <span>{target.isRecurring ? "מחק את כל האירועים" : "מחק אירוע"}</span>
        </button>
      </div>

      {/* דיאלוג אישור — z-index גבוה מהתפריט (9999) */}
      {pendingAction && (
        <ConfirmDialog
          message={confirmMessage}
          onConfirm={handleConfirm}
          onCancel={() => setPendingAction(null)}
          zIndex={10000}
        />
      )}
    </>
  );
}
