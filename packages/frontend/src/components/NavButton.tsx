import { type ReactNode } from "react";

interface NavButtonProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function NavButton({ icon, label, isActive = false, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
        isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon} {label}
    </button>
  );
}
