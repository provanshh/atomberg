import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/StatusBadge";

export const Route = createFileRoute("/_authenticated/cycles")({
  head: () => ({ meta: [{ title: "Cycles — GoalSync" }] }),
  component: CyclesPage,
});

function CyclesPage() {
  const { cycles } = useApp();
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Configuration</div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
          Performance cycles
        </h1>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cycles.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{c.phaseName}</div>
              <StatusBadge
                status={
                  c.status === "active"
                    ? "on-track"
                    : c.status === "upcoming"
                      ? "not-started"
                      : "completed"
                }
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {c.startDate} → {c.endDate}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
