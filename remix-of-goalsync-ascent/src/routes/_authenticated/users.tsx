import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Users — GoalSync" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { users } = useApp();
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Directory</div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
          Users & hierarchy
        </h1>
      </div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-left p-3 font-medium">Department</th>
              <th className="text-left p-3 font-medium">Designation</th>
              <th className="text-left p-3 font-medium">Manager</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const mgr = users.find((x) => x.id === u.managerId);
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">
                          {u.name
                            .split(" ")
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-[11px] text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className="capitalize">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-3">{u.department}</td>
                  <td className="p-3">{u.designation}</td>
                  <td className="p-3 text-muted-foreground">{mgr?.name ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
