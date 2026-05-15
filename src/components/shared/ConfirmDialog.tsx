"use client";
// דיאלוג אישור מחיקה — עוטף shadcn AlertDialog, שומר על אותו API חיצוני
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  zIndex?: number; // שמור לתאימות לאחור — shadcn AlertDialog מנהל z-index אוטומטית
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    // open=true תמיד — ההורה שולט בהצגה ע"י רינדור מותנה
    <AlertDialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent dir="rtl">
        <AlertDialogDescription className="text-sm text-foreground">
          {message}
        </AlertDialogDescription>
        <AlertDialogFooter className="flex justify-end gap-2">
          <AlertDialogCancel onClick={onCancel}>ביטול</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            כן, מחק
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
