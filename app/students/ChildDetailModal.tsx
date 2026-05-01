"use client";
// חלון פרטים מלאים של תלמיד — שני טאבים: פרטים + חוגים
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Btn from "@/components/shared/Btn";
import Badge from "@/components/shared/Badge";
import EnrollModal from "./EnrollModal";
import { calcAge, gradeFromDob, fmtDate } from "@/lib/utils";
import { deleteDocument, deleteWhere } from "@/firebase/firestore";
import { useToast } from "@/context/ToastContext";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { Child, Class, Enrollment, AppSettings } from "@/lib/types";

interface Props {
  child: Child;
  classes: Class[];
  enrollments: Enrollment[];
  onClose: () => void;
  onEdit: (c: Child) => void;
  settings: Required<AppSettings>;
}

type Tab = "details" | "classes";

// One info row: label + value
function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export default function ChildDetailModal({ child, classes, enrollments, onClose, onEdit, settings }: Props) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("details");
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [unenrollTarget, setUnenrollTarget] = useState<Enrollment | null>(null);
  const [deleteChild, setDeleteChild] = useState(false);

  // Active classes this student is enrolled in
  const myEnrollments = enrollments.filter((e) => e.child_id === child.id && e.status === "פעיל");
  const myClasses = myEnrollments.map((e) => ({ enr: e, cls: classes.find((c) => c.id === e.class_id) }));

  async function handleUnenroll() {
    if (!unenrollTarget) return;
    try {
      await deleteDocument("enrollments", unenrollTarget.id);
      showToast("הרישום הוסר", "success");
    } catch { showToast("שגיאה, נסה שוב", "error"); }
    finally { setUnenrollTarget(null); }
  }

  async function handleDeleteChild() {
    try {
      await deleteDocument("students", child.id);
      await deleteWhere("enrollments", "child_id", child.id);
      showToast("התלמיד נמחק", "success");
      onClose();
    } catch { showToast("שגיאה, נסה שוב", "error"); }
    finally { setDeleteChild(false); }
  }

  const age = child.dob ? calcAge(child.dob) : null;
  const grade = child.dob ? gradeFromDob(child.dob, settings.GRADE_FIRST_AGE, settings.GRADE_ADULT_AGE) : null;

  return (
    <>
      <Modal
        title={`${child.first_name} ${child.last_name}`}
        onClose={onClose}
        size="lg"
        footer={
          <div className="flex gap-2 justify-between w-full">
            <Btn variant="danger" onClick={() => setDeleteChild(true)}>מחיקה</Btn>
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={onClose}>סגור</Btn>
              <Btn onClick={() => onEdit(child)}>עריכה</Btn>
            </div>
          </div>
        }
      >
        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-100 mb-4 -mt-1">
          {(["details", "classes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? "border-teal-500 text-teal-700" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "details" ? "פרטים" : `חוגים (${myEnrollments.length})`}
            </button>
          ))}
        </div>

        {tab === "details" && (
          <div>
            <div className="mb-3">
              <Badge label={child.status} color={child.status === "פעיל" ? "green" : "gray"} />
            </div>
            <Row label="שם מלא" value={`${child.first_name} ${child.last_name}`} />
            {age !== null && <Row label="גיל / כיתה" value={`${age} שנים — ${grade}`} />}
            <Row label="תאריך לידה" value={child.dob ? fmtDate(child.dob) : undefined} />
            <Row label="תעודת זהות" value={child.israeli_id} />
            <Row label="טלפון" value={child.phone} />
            <Row label="הורה / איש קשר" value={child.parent_name} />
            <Row label="טלפון הורה" value={child.parent_phone} />
            <Row label="אימייל" value={child.email} />
            <Row label="כתובת" value={child.address} />

            {(child.israeli_rating || child.fide_rating || child.chess_title || child.israeli_chess_id) && (
              <>
                <hr className="my-3 border-gray-100" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">שחמט</p>
                <Row label="דירוג ישראלי" value={child.israeli_rating} />
                <Row label="מספר שחקן ישראלי" value={child.israeli_chess_id} />
                <Row label="דירוג FIDE" value={child.fide_rating} />
                <Row label="FIDE ID" value={child.fide_id} />
                <Row label="תואר" value={child.chess_title} />
              </>
            )}

            {child.notes && (
              <>
                <hr className="my-3 border-gray-100" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">הערות</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{child.notes}</p>
              </>
            )}
          </div>
        )}

        {tab === "classes" && (
          <div>
            <div className="flex justify-end mb-3">
              <Btn variant="secondary" className="text-xs px-3 py-1.5" onClick={() => setEnrollOpen(true)}>
                + רשום לחוג
              </Btn>
            </div>

            {myClasses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">לא רשום לאף חוג</p>
            ) : (
              <div className="space-y-2">
                {myClasses.map(({ enr, cls }) => (
                  <div key={enr.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2">
                      {cls && <span className="w-2.5 h-2.5 rounded-full" style={{ background: cls.color ?? "#ccc" }} />}
                      <span className="text-sm font-medium text-gray-800">{cls?.name ?? "חוג לא ידוע"}</span>
                    </div>
                    <Btn
                      variant="ghost"
                      className="text-xs px-2 py-1 text-red-400 hover:text-red-600"
                      onClick={() => setUnenrollTarget(enr)}
                    >
                      הסר רישום
                    </Btn>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Enroll modal */}
      {enrollOpen && (
        <EnrollModal
          child={child}
          allClasses={classes}
          enrollments={enrollments}
          onClose={() => setEnrollOpen(false)}
          onSaved={() => {}}
        />
      )}

      {/* Unenroll confirm */}
      {unenrollTarget && (
        <ConfirmDialog
          message="להסיר את הרישום לחוג זה?"
          onConfirm={handleUnenroll}
          onCancel={() => setUnenrollTarget(null)}
        />
      )}

      {/* Delete student confirm */}
      {deleteChild && (
        <ConfirmDialog
          message={`למחוק את ${child.first_name} ${child.last_name}? כל הרישומים יימחקו גם כן.`}
          onConfirm={handleDeleteChild}
          onCancel={() => setDeleteChild(false)}
        />
      )}
    </>
  );
}
