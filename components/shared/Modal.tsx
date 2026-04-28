"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

type Size = "sm" | "md" | "lg" | "xl";
const sizeMap: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

interface ModalProps {
  title: string;
  onClose: () => void;
  size?: Size;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ title, onClose, size = "md", children, footer }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] w-full ${sizeMap[size]}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
}
