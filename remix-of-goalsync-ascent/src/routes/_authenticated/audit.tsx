import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Audit Log — GoalSync" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { audit, users } = useApp();
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Compliance</div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Audit log</h1>
      </div>
      <Card className="divide-y divide-border">
        {audit.map((a) => {
          const u = users.find((x) => x.id === a.userId);
          return (
            <div key={a.id} className="p-4 flex items-center gap-3 text-sm">
              <Badge variant="secondary" className="font-mono text-[10px]">
                {a.actionType}
              </Badge>
              <div className="flex-1">
                <span className="font-medium">{u?.name ?? a.userId}</span>
                <span className="text-muted-foreground"> on {a.moduleName}</span>
                {a.oldValue && (
                  <span className="text-muted-foreground">
                    {" · "}
                    {a.oldValue} → {a.newValue}
                  </span>
                )}
                {!a.oldValue && a.newValue && (
                  <span className="text-muted-foreground"> · {a.newValue}</span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(a.timestamp).toLocaleString()}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
