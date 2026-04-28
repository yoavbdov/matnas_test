"use client";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface BtnProps {
  variant?: Variant;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
  className?: string;
}

const variantMap: Record<Variant, string> = {
  primary: "bg-teal-600 hover:bg-teal-700 text-white",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-600",
};

export default function Btn({
  variant = "primary",
  onClick,
  disabled,
  loading,
  type = "button",
  children,
  className = "",
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
        ${variantMap[variant]}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
        ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
