import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — GoalSync" }] }),
  component: () => {
    const { currentUser, notifications, markAllNotificationsRead } = useApp();
    const mine = notifications.filter(n => n.recipientId === currentUser?.id);
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div><div className="text-xs uppercase tracking-wider text-muted-foreground">Inbox</div><h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Notifications</h1></div>
          <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>Mark all read</Button>
        </div>
        <Card className="divide-y divide-border">
          {mine.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground"><Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />No notifications</div>}
          {mine.map(n => (
            <div key={n.id} className="p-4 flex items-start gap-3">
              <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", n.read ? "bg-muted" : "bg-primary")} />
              <div className="flex-1"><div className="font-medium text-sm">{n.title}</div><div className="text-xs text-muted-foreground">{n.message}</div></div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{n.type}</div>
            </div>
          ))}
        </Card>
      </div>
    );
  },
});