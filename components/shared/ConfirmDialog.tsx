"use client";
import { useEffect } from "react";
import Btn from "./Btn";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <p className="text-sm text-gray-700 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={onCancel}>ביטול</Btn>
          <Btn variant="danger" onClick={onConfirm}>כן, מחק</Btn>
        </div>
      </div>
    </div>
  );
}
