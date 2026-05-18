import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ProgressRing } from "@/components/app/ProgressRing";
import type { Quarter, ProgressStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/checkins")({
  head: () => ({ meta: [{ title: "Check-ins — GoalSync" }] }),
  component: CheckInsPage,
});

function CheckInsPage() {
  const { currentUser, users, goals, checkIns, addCheckIn } = useApp();
  const isManager = currentUser?.role !== "employee";
  const scope = isManager
    ? goals.filter(g => users.find(u => u.id === g.employeeId)?.managerId === currentUser?.id || currentUser?.role === "admin")
    : goals.filter(g => g.employeeId === currentUser?.id);
  const [quarter, setQuarter] = useState<Quarter>("Q2");
  const [draft, setDraft] = useState<Record<string, { actual: number; status: ProgressStatus; comment: string }>>({});

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Quarterly tracking</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Check-ins</h1>
          <p className="text-sm text-muted-foreground mt-1">Planned vs Actual — update progress and capture feedback.</p>
        </div>
        <Select value={quarter} onValueChange={(v) => setQuarter(v as Quarter)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>{["Q1","Q2","Q3","Q4"].map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {scope.map(g => {
          const previous = checkIns.filter(c => c.goalId === g.id);
          const d = draft[g.id] ?? { actual: g.achievement, status: g.progressStatus, comment: "" };
          return (
            <Card key={g.id} className="p-5">
              <div className="flex items-start gap-3">
                <ProgressRing value={g.progressPercentage} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{g.thrustArea}</div>
                  <div className="font-semibold">{g.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">Target {g.target} · Current {g.achievement}</div>
                  <div className="mt-2 flex gap-1.5 flex-wrap"><StatusBadge status={g.progressStatus} /></div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="text-xs"><span className="text-muted-foreground">Actual achievement</span>
                  <Input type="number" className="mt-1 h-9" value={d.actual} onChange={e => setDraft({...draft, [g.id]: { ...d, actual: Number(e.target.value) }})} />
                </label>
                <label className="text-xs"><span className="text-muted-foreground">Status</span>
                  <Select value={d.status} onValueChange={(v) => setDraft({...draft, [g.id]: { ...d, status: v as ProgressStatus }})}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not started</SelectItem>
                      <SelectItem value="on-track">On track</SelectItem>
                      <SelectItem value="at-risk">At risk</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>
              <Textarea placeholder="Notes for this check-in…" className="mt-2" rows={2} value={d.comment} onChange={e => setDraft({...draft, [g.id]: { ...d, comment: e.target.value }})} />
              <Button size="sm" className="mt-2 bg-gradient-primary text-primary-foreground" onClick={() => {
                addCheckIn({ goalId: g.id, quarter, plannedTarget: g.target, actualAchievement: d.actual, status: d.status, managerComment: d.comment });
                toast.success(`${quarter} check-in saved`);
              }}>Save check-in</Button>
              {previous.length > 0 && (
                <div className="mt-4 border-t pt-3 space-y-1">
                  {previous.map(c => (
                    <div key={c.id} className="text-xs flex items-center justify-between text-muted-foreground">
                      <span><b className="text-foreground">{c.quarter}</b> · planned {c.plannedTarget} / actual {c.actualAchievement}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}