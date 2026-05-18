import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ProgressRing } from "@/components/app/ProgressRing";
import { Check, X, RotateCcw, Unlock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({ meta: [{ title: "Approvals — GoalSync" }] }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { currentUser, users, goals, approveGoal, rejectGoal, requestRework, updateGoal, unlockGoal } = useApp();
  const [comments, setComments] = useState<Record<string, string>>({});

  const queue = useMemo(() => {
    if (currentUser?.role === "admin") return goals;
    const team = users.filter(u => u.managerId === currentUser?.id).map(u => u.id);
    return goals.filter(g => team.includes(g.employeeId));
  }, [goals, users, currentUser]);

  const pending = queue.filter(g => g.status === "submitted");
  const others = queue.filter(g => g.status !== "submitted");

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Workflow</div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">Review goals, leave feedback, or send back for rework. Approved goals lock automatically.</p>
      </div>

      <Card className="p-5">
        <div className="font-semibold mb-3">Pending review ({pending.length})</div>
        <div className="space-y-3">
          {pending.map(g => {
            const u = users.find(x => x.id === g.employeeId);
            return (
              <div key={g.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{u?.name.split(" ").map(s=>s[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{u?.name}</span>
                      <span className="text-xs text-muted-foreground">· {g.thrustArea}</span>
                      <StatusBadge status={g.status} />
                    </div>
                    <div className="font-semibold mt-1">{g.title}</div>
                    {g.description && <div className="text-xs text-muted-foreground mt-1">{g.description}</div>}
                    <div className="grid grid-cols-3 gap-2 mt-3 max-w-md">
                      <label className="text-xs"><span className="text-muted-foreground">Target</span><Input type="number" value={g.target} onChange={e => updateGoal(g.id, { target: Number(e.target.value) })} className="mt-1 h-8" /></label>
                      <label className="text-xs"><span className="text-muted-foreground">Weight %</span><Input type="number" value={g.weightage} onChange={e => updateGoal(g.id, { weightage: Number(e.target.value) })} className="mt-1 h-8" /></label>
                      <label className="text-xs"><span className="text-muted-foreground">Achievement</span><Input type="number" value={g.achievement} onChange={e => updateGoal(g.id, { achievement: Number(e.target.value) })} className="mt-1 h-8" /></label>
                    </div>
                    <Textarea placeholder="Add a comment…" value={comments[g.id] ?? ""} onChange={e => setComments({...comments, [g.id]: e.target.value})} className="mt-3" rows={2} />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" className="bg-success text-success-foreground hover:opacity-90" onClick={() => { approveGoal(g.id, comments[g.id]); toast.success("Goal approved & locked"); }}><Check className="h-4 w-4 mr-1" />Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => { if (!comments[g.id]) return toast.error("Comment required"); requestRework(g.id, comments[g.id]); toast.success("Sent for rework"); }}><RotateCcw className="h-4 w-4 mr-1" />Rework</Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => { if (!comments[g.id]) return toast.error("Comment required"); rejectGoal(g.id, comments[g.id]); toast.success("Goal rejected"); }}><X className="h-4 w-4 mr-1" />Reject</Button>
                    </div>
                  </div>
                  <ProgressRing value={g.progressPercentage} />
                </div>
              </div>
            );
          })}
          {pending.length === 0 && <div className="text-center py-10 text-sm text-muted-foreground">All caught up 🎉</div>}
        </div>
      </Card>

      <Card className="p-5">
        <div className="font-semibold mb-3">All goals</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border"><tr><th className="text-left py-2 font-medium">Employee</th><th className="text-left font-medium">Goal</th><th className="text-left font-medium">Status</th><th className="text-left font-medium">Progress</th><th></th></tr></thead>
            <tbody>
              {others.map(g => {
                const u = users.find(x => x.id === g.employeeId);
                return (
                  <tr key={g.id} className="border-b border-border last:border-0">
                    <td className="py-2.5">{u?.name}</td>
                    <td className="py-2.5"><div className="font-medium truncate max-w-xs">{g.title}</div><div className="text-[11px] text-muted-foreground">{g.thrustArea}</div></td>
                    <td className="py-2.5"><StatusBadge status={g.status} /></td>
                    <td className="py-2.5"><div className="flex items-center gap-2"><div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-primary" style={{width: `${g.progressPercentage}%`}} /></div><span className="text-xs">{g.progressPercentage}%</span></div></td>
                    <td className="py-2.5 text-right">{g.isLocked && currentUser?.role === "admin" && <Button size="sm" variant="ghost" onClick={() => { unlockGoal(g.id); toast.success("Unlocked"); }}><Unlock className="h-3.5 w-3.5 mr-1" />Unlock</Button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}