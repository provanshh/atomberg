import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  rework: "bg-warning/15 text-warning-foreground",
  "on-track": "bg-success/10 text-success",
  "at-risk": "bg-warning/15 text-warning-foreground",
  "not-started": "bg-muted text-muted-foreground",
  completed: "bg-success/15 text-success",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn("capitalize border-0 font-medium", MAP[status] ?? "")}>
      {status.replace("-", " ")}
    </Badge>
  );
}
