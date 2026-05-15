"use client";
// מספק showToast לכל הפרויקט — מנהל את Sonner מאחורי הקלעים
// כל קריאות showToast(message, type) ממשיכות לעבוד בלי שינוי
import { createContext, useContext, useCallback } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type ToastType = "success" | "error";

interface ToastContextValue {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((message: string, type: ToastType) => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toaster מרנדר את הטוסטים בתחתית המסך */}
      <Toaster dir="rtl" richColors position="top-center" />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
