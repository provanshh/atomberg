import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/app/dashboards/AdminDashboard";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — GoalSync" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { goals, users } = useApp();

  const exportCSV = () => {
    const headers = [
      "Employee",
      "Department",
      "Goal",
      "ThrustArea",
      "Weightage",
      "Progress%",
      "Status",
      "ProgressStatus",
    ];
    const rows = goals.map((g) => {
      const u = users.find((x) => x.id === g.employeeId);
      return [
        u?.name ?? "",
        u?.department ?? "",
        g.title,
        g.thrustArea,
        g.weightage,
        g.progressPercentage,
        g.status,
        g.progressStatus,
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goalsync-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics exported", { description: `${rows.length} goals included` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2 -mb-2">
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button
          size="sm"
          onClick={() => window.print()}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
        >
          <Download className="h-4 w-4 mr-2" />
          Print report
        </Button>
      </div>
      <AdminDashboard />
    </div>
  );
}
