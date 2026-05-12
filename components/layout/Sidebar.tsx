"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  DoorOpen,
  Calendar,
  Trophy,
  Layers,
  ClipboardCheck,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/schedule", label: "לוח זמנים", icon: Calendar },
  { href: "/students", label: "שחקנים", icon: Users },
  { href: "/teachers", label: "מדריכים", icon: UserCheck },
  { href: "/classes", label: "חוגים", icon: BookOpen },
  { href: "/tournaments", label: "תחרויות ואירועים", icon: Trophy },
  { href: "/rooms", label: "חדרים וציוד", icon: DoorOpen },
  { href: "/attendance", label: "נוכחות", icon: ClipboardCheck },
  { href: "/league-groups", label: "קבוצות ליגה", icon: Layers },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 shrink-0 h-screen sticky top-0 bg-gray-900 text-white flex flex-col"
      dir="rtl"
    >
      <div className="px-5 py-5 border-b border-gray-700">
        <span className="text-lg font-bold tracking-wide text-teal-400">
          Chess Nimbus ♟
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-teal-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={() => signOut(auth)}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          התנתקות
        </button>
      </div>
    </aside>
  );
}
