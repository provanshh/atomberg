import { useApp } from "@/lib/store";
import { KpiCard } from "@/components/app/KpiCard";
import { Card } from "@/components/ui/card";
import { Users, Target, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { cn } from "@/lib/utils";

const trend = [
  { m: "May", goals: 24, completed: 0 },
  { m: "Jun", goals: 56, completed: 4 },
  { m: "Jul", goals: 78, completed: 18 },
  { m: "Aug", goals: 82, completed: 32 },
  { m: "Sep", goals: 86, completed: 41 },
  { m: "Oct", goals: 88, completed: 50 },
  { m: "Nov", goals: 90, completed: 58 },
  { m: "Dec", goals: 92, completed: 64 },
  { m: "Jan", goals: 94, completed: 70 },
  { m: "Feb", goals: 95, completed: 78 },
];

export function AdminDashboard() {
  const { users, goals } = useApp();
  const employees = users.filter((u) => u.role === "employee");
  const submitted = goals.filter((g) => g.status !== "draft").length;
  const approved = goals.filter((g) => g.status === "approved").length;
  const atRisk = goals.filter((g) => g.progressStatus === "at-risk").length;
  const participation = Math.round((submitted / Math.max(1, employees.length * 3)) * 100);

  const byDept = Array.from(new Set(users.map((u) => u.department))).map((d) => {
    const gs = goals.filter((g) => users.find((u) => u.id === g.employeeId)?.department === d);
    const avg = gs.length
      ? Math.round(gs.reduce((s, g) => s + g.progressPercentage, 0) / gs.length)
      : 0;
    return { dept: d, avg, goals: gs.length };
  });

  const statusBreakdown = [
    {
      name: "Approved",
      value: goals.filter((g) => g.status === "approved").length,
      color: "var(--success)",
    },
    {
      name: "Submitted",
      value: goals.filter((g) => g.status === "submitted").length,
      color: "var(--primary)",
    },
    {
      name: "Draft",
      value: goals.filter((g) => g.status === "draft").length,
      color: "var(--muted-foreground)",
    },
    {
      name: "Rejected",
      value: goals.filter((g) => g.status === "rejected").length,
      color: "var(--destructive)",
    },
  ].filter((s) => s.value > 0);

  // Heatmap data (dept × quarter)
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const heatmap = byDept.map((d) => ({
    dept: d.dept,
    cells: quarters.map((q, i) => Math.max(20, Math.min(100, d.avg + i * 5 - 10))),
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Company analytics
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
          Organization performance — FY26
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active employees"
          value={employees.length}
          delta={12}
          hint="vs last cycle"
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="Goals approved"
          value={approved}
          hint={`of ${goals.length} total`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="success"
        />
        <KpiCard
          label="Participation"
          value={`${Math.min(100, participation)}%`}
          delta={9}
          hint="goal-setting cycle"
          icon={<Target className="h-4 w-4" />}
        />
        <KpiCard
          label="At-risk goals"
          value={atRisk}
          hint="needs escalation"
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="warning"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Goal lifecycle</div>
              <div className="text-xs text-muted-foreground">
                Submitted vs Completed across FY26
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="m"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="goals"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-semibold mb-3">Status breakdown</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {statusBreakdown.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold mb-4">Department performance</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="dept"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="avg" fill="var(--accent)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-semibold mb-4">Department × quarter heatmap</div>
          <div className="grid gap-2">
            <div className="grid grid-cols-[1fr_repeat(4,minmax(0,1fr))] gap-2 text-[11px] text-muted-foreground pb-2 border-b border-border">
              <div></div>
              {quarters.map((q) => (
                <div key={q} className="text-center font-medium">
                  {q}
                </div>
              ))}
            </div>
            {heatmap.map((row) => (
              <div
                key={row.dept}
                className="grid grid-cols-[1fr_repeat(4,minmax(0,1fr))] gap-2 items-center"
              >
                <div className="text-xs font-medium truncate">{row.dept}</div>
                {row.cells.map((v, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-9 rounded-md grid place-items-center text-[11px] font-semibold text-white",
                      v >= 80
                        ? "bg-success"
                        : v >= 60
                          ? "bg-primary"
                          : v >= 40
                            ? "bg-warning text-warning-foreground"
                            : "bg-destructive",
                    )}
                  >
                    {v}%
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
