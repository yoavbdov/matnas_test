import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
}

export default function PageShell({ title, children }: PageShellProps) {
  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopBar title={title} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
