import { Outlet, createFileRoute, Link } from "@tanstack/react-router";
import {
  Clock,
  Database,
  Layers,
} from "lucide-react";
import { NavButton } from "@/components/NavButton";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayoutRoute,
});

function DashboardLayoutRoute() {
  return (
    <DashboardLayout
      sidebar={
        <>
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
          <Link to="/dashboard/execution-logs" className="block">
            {({ isActive }) => (
              <NavButton
                icon={<Clock size={18} />}
                label="Execution Logs"
                isActive={isActive}
              />
            )}
          </Link>
        </>
      }
    >
      <Outlet />
    </DashboardLayout>
  );
}
