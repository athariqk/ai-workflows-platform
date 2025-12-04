import type { ReactNode } from "react";
import { Activity, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  showBackLink?: boolean;
  backLinkTo?: string;
  backLinkLabel?: string;
}

export function DashboardLayout({
  children,
  sidebar,
  showBackLink = false,
  backLinkTo = "/dashboard/workflows",
  backLinkLabel = "Back to Dashboard",
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 flex items-center min-h-[68px] border-b border-slate-100">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <Activity size={24} /> AWP
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {showBackLink && (
            <Link
              to={backLinkTo}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors mb-4"
            >
              <ArrowLeft size={16} /> {backLinkLabel}
            </Link>
          )}
          {sidebar}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200"></div>
            <div>
              <p className="text-sm font-medium">Ahmad</p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
