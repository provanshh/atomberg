import { useApp } from "@/lib/store";
import { KpiCard } from "@/components/app/KpiCard";
import { ProgressRing } from "@/components/app/ProgressRing";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Target,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Calendar,
  Activity,
  Sparkles,
  Zap,
  MessageSquare,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ResponsiveContainer, XAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";

const trend = [
  { m: "May", v: 0 },
  { m: "Jun", v: 12 },
  { m: "Jul", v: 28 },
  { m: "Aug", v: 35 },
  { m: "Sep", v: 48 },
  { m: "Oct", v: 56 },
  { m: "Nov", v: 62 },
  { m: "Dec", v: 68 },
  { m: "Jan", v: 74 },
  { m: "Feb", v: 79 },
];

export function EmployeeDashboard() {
  const { currentUser, goals, audit, checkIns, notifications } = useApp();
  const myGoals = goals.filter((g) => g.employeeId === currentUser?.id);
  const totalWeight = myGoals.reduce((a, g) => a + g.weightage, 0);
  const avgProgress = myGoals.length
    ? Math.round(myGoals.reduce((a, g) => a + g.progressPercentage, 0) / myGoals.length)
    : 0;
  const onTrack = myGoals.filter(
    (g) => g.progressStatus === "on-track" || g.progressStatus === "completed",
  ).length;
  const atRisk = myGoals.filter((g) => g.progressStatus === "at-risk").length;
  const myCheckIns = checkIns.filter((c) => myGoals.some((g) => g.id === c.goalId));
  const myActivity = audit.filter((a) => a.userId === currentUser?.id).slice(0, 6);
  const recentFeedback = myGoals.filter((g) => g.managerComment).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Welcome back</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
            Hi {currentUser?.name.split(" ")[0]}, here's your FY26 snapshot
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/checkins">
              <Calendar className="h-4 w-4 mr-2" />
              Quarterly check-in
            </Link>
          </Button>
          <Button asChild className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            <Link to="/goals">
              <Plus className="h-4 w-4 mr-2" />
              Create goal
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active goals"
          value={myGoals.length}
          hint={`${totalWeight}% allocated`}
          icon={<Target className="h-4 w-4" />}
        />
        <KpiCard
          label="Avg progress"
          value={`${avgProgress}%`}
          delta={8}
          hint="vs last quarter"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="success"
        />
        <KpiCard
          label="On track"
          value={onTrack}
          hint={`of ${myGoals.length}`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="success"
        />
        <KpiCard
          label="At risk"
          value={atRisk}
          hint="needs attention"
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="warning"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Goal completion trend</div>
              <div className="text-xs text-muted-foreground">Average progress across all goals</div>
            </div>
            <div className="text-xs text-muted-foreground">FY26</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="m"
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
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-semibold mb-1">Quarterly tracker</div>
          <div className="text-xs text-muted-foreground mb-4">FY26 cycle</div>
          <div className="space-y-3">
            {[
              ["Q1", "Jul", "Completed"],
              ["Q2", "Oct", "Completed"],
              ["Q3", "Jan", "Active"],
              ["Q4", "Apr", "Upcoming"],
            ].map(([q, m, s]) => (
              <div key={q} className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-lg grid place-items-center text-xs font-semibold ${s === "Completed" ? "bg-success/15 text-success" : s === "Active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {q}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{q} Check-in</div>
                  <div className="text-xs text-muted-foreground">Due {m}</div>
                </div>
                <StatusBadge
                  status={
                    s.toLowerCase() === "active"
                      ? "on-track"
                      : s === "Completed"
                        ? "completed"
                        : "not-started"
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">My goals</div>
          <Link
            to="/goals"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {myGoals.slice(0, 4).map((g) => (
            <div
              key={g.id}
              className="rounded-xl border border-border p-4 hover:shadow-soft transition-shadow"
            >
              <div className="flex items-start gap-3">
                <ProgressRing value={g.progressPercentage} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {g.thrustArea}
                  </div>
                  <div className="font-medium truncate">{g.title}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <StatusBadge status={g.status} />
                    <StatusBadge status={g.progressStatus} />
                    <span className="text-muted-foreground">Weight {g.weightage}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {myGoals.length === 0 && (
            <div className="md:col-span-2 text-center py-10 text-sm text-muted-foreground">
              No goals yet.{" "}
              <Link to="/goals" className="text-primary">
                Create your first one
              </Link>
              .
            </div>
          )}
        </div>
      </Card>

      {/* Extra row: weight allocation + recent activity + manager feedback */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-primary/10 grid place-items-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">Weightage allocation</div>
              <div className="text-xs text-muted-foreground">{totalWeight}% of 100% allocated</div>
            </div>
          </div>
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted">
            {myGoals.map((g, i) => (
              <div
                key={g.id}
                className={cn(
                  "h-full",
                  [
                    "bg-primary",
                    "bg-accent",
                    "bg-success",
                    "bg-warning",
                    "bg-chart-4",
                    "bg-chart-5",
                  ][i % 6],
                )}
                style={{ width: `${g.weightage}%` }}
                title={`${g.title} — ${g.weightage}%`}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {myGoals.slice(0, 5).map((g, i) => (
              <div key={g.id} className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    [
                      "bg-primary",
                      "bg-accent",
                      "bg-success",
                      "bg-warning",
                      "bg-chart-4",
                      "bg-chart-5",
                    ][i % 6],
                  )}
                />
                <span className="truncate flex-1">{g.title}</span>
                <span className="text-muted-foreground font-medium">{g.weightage}%</span>
              </div>
            ))}
            {totalWeight !== 100 && (
              <div className="mt-2 text-[11px] text-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Allocate{" "}
                {100 - totalWeight > 0
                  ? `${100 - totalWeight}% more`
                  : `${totalWeight - 100}% less`}{" "}
                to reach 100%
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-accent/15 grid place-items-center">
              <Activity className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <div className="font-semibold text-sm">Recent activity</div>
              <div className="text-xs text-muted-foreground">Your last actions</div>
            </div>
          </div>
          <div className="space-y-3">
            {myActivity.length === 0 && (
              <div className="text-xs text-muted-foreground py-6 text-center">No activity yet.</div>
            )}
            {myActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-xs">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shadow-glow shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {a.actionType}{" "}
                    <span className="text-muted-foreground font-normal">on {a.moduleName}</span>
                  </div>
                  {a.newValue && <div className="text-muted-foreground truncate">{a.newValue}</div>}
                </div>
                <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(a.timestamp).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-success/15 grid place-items-center">
              <MessageSquare className="h-3.5 w-3.5 text-success" />
            </div>
            <div>
              <div className="font-semibold text-sm">Manager feedback</div>
              <div className="text-xs text-muted-foreground">Latest comments on your goals</div>
            </div>
          </div>
          <div className="space-y-3">
            {recentFeedback.length === 0 && (
              <div className="text-xs text-muted-foreground py-6 text-center">No feedback yet.</div>
            )}
            {recentFeedback.map((g) => (
              <div key={g.id} className="rounded-lg border border-border p-3 text-xs">
                <div className="font-medium truncate">{g.title}</div>
                <div className="text-muted-foreground mt-1 line-clamp-2">"{g.managerComment}"</div>
                <div className="mt-2">
                  <StatusBadge status={g.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick action strip */}
      <Card className="p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 dark:from-primary/15 dark:to-accent/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold">Ready for your next check-in?</div>
              <div className="text-xs text-muted-foreground">
                You've logged {myCheckIns.length} check-ins ·{" "}
                {notifications.filter((n) => n.recipientId === currentUser?.id && !n.read).length}{" "}
                unread updates
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/checkins">
                <Calendar className="h-4 w-4 mr-2" />
                Log check-in
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              <Link to="/goals">
                <Plus className="h-4 w-4 mr-2" />
                Add goal
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
