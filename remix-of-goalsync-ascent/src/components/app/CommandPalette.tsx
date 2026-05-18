import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Target,
  CheckCircle2,
  Users,
  BarChart3,
  Bell,
  ScrollText,
  Settings,
  Plus,
  Sun,
  Moon,
  Shield,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useTheme } from "./ThemeToggle";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser, goals, users } = useApp();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };
  const myGoals = goals.filter((g) => g.employeeId === currentUser?.id).slice(0, 5);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search goals, people, navigate…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/goals")}>
            <Target className="h-4 w-4 mr-2" />
            My Goals
          </CommandItem>
          <CommandItem onSelect={() => go("/checkins")}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Check-ins
          </CommandItem>
          <CommandItem onSelect={() => go("/team")}>
            <Users className="h-4 w-4 mr-2" />
            My Team
          </CommandItem>
          <CommandItem onSelect={() => go("/analytics")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </CommandItem>
          <CommandItem onSelect={() => go("/approvals")}>
            <Shield className="h-4 w-4 mr-2" />
            Approvals
          </CommandItem>
          <CommandItem onSelect={() => go("/audit")}>
            <ScrollText className="h-4 w-4 mr-2" />
            Audit Log
          </CommandItem>
          <CommandItem onSelect={() => go("/cycles")}>
            <Settings className="h-4 w-4 mr-2" />
            Cycles
          </CommandItem>
          <CommandItem onSelect={() => go("/notifications")}>
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("/goals")}>
            <Plus className="h-4 w-4 mr-2" />
            Create new goal
          </CommandItem>
          <CommandItem
            onSelect={() => {
              toggle();
              setOpen(false);
            }}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 mr-2" />
            ) : (
              <Moon className="h-4 w-4 mr-2" />
            )}
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </CommandItem>
        </CommandGroup>
        {myGoals.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="My Goals">
              {myGoals.map((g) => (
                <CommandItem key={g.id} onSelect={() => go("/goals")}>
                  <Target className="h-4 w-4 mr-2 opacity-60" />
                  <span className="truncate">{g.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {g.progressPercentage}%
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="People">
          {users.slice(0, 6).map((u) => (
            <CommandItem key={u.id} onSelect={() => go("/users")}>
              <Users className="h-4 w-4 mr-2 opacity-60" />
              <span>{u.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground capitalize">
                {u.role} · {u.department}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
