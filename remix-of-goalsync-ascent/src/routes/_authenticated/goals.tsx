import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ProgressRing } from "@/components/app/ProgressRing";
import { StatusBadge } from "@/components/app/StatusBadge";
import { thrustAreas } from "@/lib/mock-data";
import type { Goal, UoMType } from "@/lib/types";
import { AlertTriangle, CheckCircle2, Lock, Pencil, Plus, Send, Sparkles, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "My Goals — GoalSync" }] }),
  component: GoalsPage,
});

const blank = { thrustArea: thrustAreas[0], title: "", description: "", uomType: "numeric" as UoMType, target: 0, achievement: 0, weightage: 10 };

function GoalsPage() {
  const { currentUser, goals, addGoal, updateGoal, deleteGoal, submitGoals } = useApp();
  const myGoals = useMemo(() => goals.filter((g) => g.employeeId === currentUser?.id), [goals, currentUser]);
  const totalWeight = myGoals.reduce((s, g) => s + g.weightage, 0);
  const drafts = myGoals.filter((g) => g.status === "draft").length;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState(blank);

  const reset = () => { setForm(blank); setEditing(null); };
  const openCreate = () => { reset(); setOpen(true); };
  const openEdit = (g: Goal) => { setEditing(g); setForm({ thrustArea: g.thrustArea, title: g.title, description: g.description, uomType: g.uomType, target: g.target, achievement: g.achievement, weightage: g.weightage }); setOpen(true); };

  const save = (asDraft: boolean) => {
    if (!form.title.trim()) return toast.error("Title required");
    if (form.weightage < 10) return toast.error("Weightage must be ≥ 10%");
    if (!editing && myGoals.length >= 8) return toast.error("Maximum 8 goals allowed");
    const projectedTotal = (editing ? totalWeight - editing.weightage : totalWeight) + form.weightage;
    if (projectedTotal > 100) return toast.error(`Total weightage would be ${projectedTotal}%`);

    if (editing) {
      updateGoal(editing.id, { ...form });
      toast.success("Goal updated");
    } else {
      addGoal({ ...form, employeeId: currentUser!.id, status: asDraft ? "draft" : "draft", isLocked: false, isShared: false });
      toast.success(asDraft ? "Draft saved" : "Goal added");
    }
    setOpen(false); reset();
  };

  const submit = () => {
    if (totalWeight !== 100) return toast.error(`Weightage must total 100% (currently ${totalWeight}%)`);
    if (drafts === 0) return toast.info("No draft goals to submit");
    submitGoals(currentUser!.id);
    toast.success("Goals submitted for approval");
  };

  const validationOk = totalWeight === 100 && myGoals.length > 0 && myGoals.length <= 8 && myGoals.every(g => g.weightage >= 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Goal portfolio</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">My goals</h1>
          <p className="text-sm text-muted-foreground mt-1">Total weightage must equal 100% across up to 8 goals.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={submit} disabled={!validationOk || drafts === 0}><Send className="h-4 w-4 mr-2" />Submit for approval</Button>
          <Button onClick={openCreate} className="bg-gradient-primary text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4 mr-2" />New goal</Button>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <ProgressRing value={totalWeight} size={64} />
            <div>
              <div className="text-xs text-muted-foreground">Total weightage</div>
              <div className="text-xl font-semibold">{totalWeight}% / 100%</div>
            </div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <div className="text-xs text-muted-foreground">Goals</div>
            <div className="text-xl font-semibold">{myGoals.length} / 8</div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <div className="text-xs text-muted-foreground">Drafts</div>
            <div className="text-xl font-semibold">{drafts}</div>
          </div>
          <div className="ml-auto">
            {validationOk ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium"><CheckCircle2 className="h-4 w-4" />Ready to submit</div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/15 text-warning-foreground text-sm font-medium"><AlertTriangle className="h-4 w-4" />Adjust weightage to 100%</div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {myGoals.map((g) => (
          <Card key={g.id} className="p-5 hover:shadow-elegant transition-shadow">
            <div className="flex items-start gap-4">
              <ProgressRing value={g.progressPercentage} size={64} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>{g.thrustArea}</span>
                  {g.isShared && <span className="inline-flex items-center gap-1 text-primary"><Users className="h-3 w-3" />Shared</span>}
                  {g.isLocked && <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" />Locked</span>}
                </div>
                <div className="font-semibold mt-0.5">{g.title}</div>
                {g.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.description}</div>}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <StatusBadge status={g.status} />
                  <StatusBadge status={g.progressStatus} />
                  <span className="text-muted-foreground">Weight {g.weightage}%</span>
                  <span className="text-muted-foreground">Target {g.target}{g.uomType==="percentage"?"%":""}</span>
                </div>
                {g.managerComment && (
                  <div className="mt-3 text-xs p-2 rounded-md bg-secondary border border-border">
                    <span className="font-medium">Manager: </span>{g.managerComment}
                  </div>
                )}
                <div className="mt-3 flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(g)} disabled={g.isLocked}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => { deleteGoal(g.id); toast.success("Goal removed"); }} disabled={g.isLocked} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {myGoals.length === 0 && (
          <Card className="md:col-span-2 p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 grid place-items-center mb-3"><Sparkles className="h-5 w-5 text-primary" /></div>
            <div className="font-semibold">No goals yet</div>
            <p className="text-sm text-muted-foreground mt-1">Create your first FY26 goal to get started.</p>
            <Button onClick={openCreate} className="mt-4 bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Create goal</Button>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit goal" : "Create new goal"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Thrust area</Label>
                <Select value={form.thrustArea} onValueChange={(v) => setForm({...form, thrustArea: v})}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{thrustAreas.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>UoM type</Label>
                <Select value={form.uomType} onValueChange={(v) => setForm({...form, uomType: v as UoMType})}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numeric">Numeric</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="timeline">Timeline</SelectItem>
                    <SelectItem value="zero-based">Zero-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Goal title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="mt-1.5" placeholder="e.g. Ship payments v2 with 99.9% uptime" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1.5" rows={3} placeholder="Why this matters, how you'll measure it…" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Target</Label><Input type="number" value={form.target} onChange={e => setForm({...form, target: Number(e.target.value)})} className="mt-1.5" /></div>
              <div><Label>Achievement</Label><Input type="number" value={form.achievement} onChange={e => setForm({...form, achievement: Number(e.target.value)})} className="mt-1.5" /></div>
              <div>
                <Label>Weightage %</Label>
                <Input type="number" min={10} max={100} value={form.weightage} onChange={e => setForm({...form, weightage: Number(e.target.value)})} className={cn("mt-1.5", form.weightage < 10 && "border-destructive")} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Min 10% per goal · current total {totalWeight + (editing ? -editing.weightage : 0) + form.weightage}%</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => save(true)}>Save draft</Button>
            <Button onClick={() => save(false)} className="bg-gradient-primary text-primary-foreground">{editing ? "Update goal" : "Add goal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}