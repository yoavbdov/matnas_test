"use client";
import { useAuthContext } from "@/context/AuthContext";

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const { user } = useAuthContext();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6" dir="rtl">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      <span className="text-sm text-gray-400">{user?.email}</span>
    </header>
  );
}
