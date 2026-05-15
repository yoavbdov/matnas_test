"use client";
// חלון קופץ אחיד — עוטף את shadcn Dialog, שומר על אותו API חיצוני
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Size = "sm" | "md" | "lg" | "xl";

// ממפה גודל לרוחב מקסימלי של Tailwind
const sizeMap: Record<Size, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

interface ModalProps {
  title: string;
  onClose: () => void;
  size?: Size;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ title, onClose, size = "md", children, footer }: ModalProps) {
  return (
    // open=true תמיד — ההורה שולט בהצגה ע"י רינדור מותנה של Modal
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        dir="rtl"
        className={`flex flex-col max-h-[90vh] gap-0 p-0 ${sizeMap[size]}`}
        showCloseButton={false}
      >
        {/* כותרת עם כפתור סגירה */}
        <DialogHeader className="flex-row items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>

        {/* תוכן גלילה */}
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>

        {/* פוטר אופציונלי */}
        {footer && (
          <DialogFooter className="px-6 py-4 border-t border-border flex justify-end gap-2 shrink-0 rounded-b-xl">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
