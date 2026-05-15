// Reusable tab button used in the Tournaments & Events page
interface TabBtnProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function TabBtn({ label, active, onClick }: TabBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        active
          ? "border-teal-600 text-teal-700 bg-white"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}
