import { Outlet, createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Clock,
  Database,
  Layers,
} from "lucide-react";
import { NavButton } from "@/components/NavButton";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <Activity size={24} /> AWP
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard/agents" className="block">
            {({ isActive }) => (
              <NavButton
                icon={<Database size={18} />}
                label="Agents"
                isActive={isActive}
              />
            )}
          </Link>
          <Link to="/dashboard/workflows" className="block">
            {({ isActive }) => (
              <NavButton
                icon={<Layers size={18} />}
                label="Workflows"
                isActive={isActive}
              />
            )}
          </Link>
          <NavButton
            icon={<Clock size={18} />}
            label="Execution Logs"
          />
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
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
