import { useApp } from "@/lib/store";
import { KpiCard } from "@/components/app/KpiCard";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ProgressRing } from "@/components/app/ProgressRing";
import { StatusBadge } from "@/components/app/StatusBadge";

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ManagerDashboard() {
  const { currentUser, users, goals } = useApp();
  const team = users.filter((u) => u.managerId === currentUser?.id);
  const teamIds = team.map((u) => u.id);
  const teamGoals = goals.filter((g) => teamIds.includes(g.employeeId));
  const pending = teamGoals.filter((g) => g.status === "submitted");
  const atRisk = teamGoals.filter((g) => g.progressStatus === "at-risk");
  const avg = teamGoals.length
    ? Math.round(teamGoals.reduce((a, g) => a + g.progressPercentage, 0) / teamGoals.length)
    : 0;

  const perPerson = team.map((u) => {
    const gs = goals.filter((g) => g.employeeId === u.id);
    const a = gs.length
      ? Math.round(gs.reduce((s, g) => s + g.progressPercentage, 0) / gs.length)
      : 0;
    return { name: u.name.split(" ")[0], progress: a, goals: gs.length };
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Team overview</div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
          {currentUser?.department} — FY26
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Team size" value={team.length} icon={<Users className="h-4 w-4" />} />
        <KpiCard
          label="Avg progress"
          value={`${avg}%`}
          delta={6}
          hint="vs last quarter"
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="success"
        />
        <KpiCard
          label="Pending approvals"
          value={pending.length}
          hint="awaiting review"
          icon={<Clock className="h-4 w-4" />}
          accent="warning"
        />
        <KpiCard
          label="Goals at risk"
          value={atRisk.length}
          hint="needs intervention"
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="destructive"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Team progress</div>
              <div className="text-xs text-muted-foreground">
                Average across all goals per person
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perPerson}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
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
                <Bar dataKey="progress" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Pending approvals</div>
            <Link
              to="/approvals"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Review all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 4).map((g) => {
              const u = users.find((x) => x.id === g.employeeId);
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px]">{u && initials(u.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{g.title}</div>
                    <div className="text-[11px] text-muted-foreground">{u?.name}</div>
                  </div>
                  <StatusBadge status={g.status} />
                </div>
              );
            })}
            {pending.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No pending approvals 🎉
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="font-semibold mb-4">Team members</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {team.map((u) => {
            const gs = goals.filter((g) => g.employeeId === u.id);
            const avg = gs.length
              ? Math.round(gs.reduce((s, g) => s + g.progressPercentage, 0) / gs.length)
              : 0;
            return (
              <div
                key={u.id}
                className="rounded-xl border border-border p-4 flex items-center gap-3"
              >
                <ProgressRing value={avg} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.designation}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{gs.length} goals</div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/team">View</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
