import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { EmployeeDashboard } from "@/components/app/dashboards/EmployeeDashboard";
import { ManagerDashboard } from "@/components/app/dashboards/ManagerDashboard";
import { AdminDashboard } from "@/components/app/dashboards/AdminDashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GoalSync" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { currentUser } = useApp();
  if (!currentUser) return null;
  if (currentUser.role === "admin") return <AdminDashboard />;
  if (currentUser.role === "manager") return <ManagerDashboard />;
  return <EmployeeDashboard />;
}