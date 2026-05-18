import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/app/ProgressRing";
import { StatusBadge } from "@/components/app/StatusBadge";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "My Team — GoalSync" }] }),
  component: TeamPage,
});

function TeamPage() {
  const { currentUser, users, goals } = useApp();
  const team = users.filter(u => u.managerId === currentUser?.id);
  return (
    <div className="space-y-6">
      <div><div className="text-xs uppercase tracking-wider text-muted-foreground">People</div><h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">My team</h1></div>
      <div className="grid md:grid-cols-2 gap-4">
        {team.map(u => {
          const gs = goals.filter(g => g.employeeId === u.id);
          const avg = gs.length ? Math.round(gs.reduce((s,g)=>s+g.progressPercentage,0)/gs.length) : 0;
          return (
            <Card key={u.id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12"><AvatarFallback className="bg-gradient-primary text-primary-foreground">{u.name.split(" ").map(s=>s[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                <div className="flex-1"><div className="font-semibold">{u.name}</div><div className="text-xs text-muted-foreground">{u.designation}</div></div>
                <ProgressRing value={avg} />
              </div>
              <div className="mt-4 space-y-2">
                {gs.map(g => (
                  <div key={g.id} className="flex items-center justify-between text-sm">
                    <div className="truncate flex-1 pr-2">{g.title}</div>
                    <StatusBadge status={g.progressStatus} />
                  </div>
                ))}
                {gs.length === 0 && <div className="text-xs text-muted-foreground">No goals yet</div>}
              </div>
              <Link to="/approvals" className="text-xs text-primary hover:underline mt-3 inline-block">Review approvals →</Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}