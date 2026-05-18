import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  Target,
  CheckCircle2,
  Users,
  BarChart3,
  Shield,
  ScrollText,
  Settings,
  LogOut,
  Search,
  Command,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";

const NAV: Record<string, { label: string; to: string; icon: LucideIcon }[]> = {
  employee: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "My Goals", to: "/goals", icon: Target },
    { label: "Check-ins", to: "/checkins", icon: CheckCircle2 },
    { label: "Notifications", to: "/notifications", icon: Bell },
  ],
  manager: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "My Team", to: "/team", icon: Users },
    { label: "Approvals", to: "/approvals", icon: CheckCircle2 },
    { label: "Check-ins", to: "/checkins", icon: BarChart3 },
    { label: "Notifications", to: "/notifications", icon: Bell },
  ],
  admin: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Analytics", to: "/analytics", icon: BarChart3 },
    { label: "Users", to: "/users", icon: Users },
    { label: "Cycles", to: "/cycles", icon: Settings },
    { label: "Audit Log", to: "/audit", icon: ScrollText },
    { label: "Approvals", to: "/approvals", icon: Shield },
  ],
};

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell() {
  const {
    currentUser,
    loading,
    logout,
    notifications,
    markAllNotificationsRead,
    users,
    setCurrentUser,
  } = useApp();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate({ to: "/login" });
    }
  }, [currentUser, loading, navigate]);

  const role = currentUser?.role ?? "employee";
  const nav = NAV[role];
  const myNotifs = useMemo(
    () => notifications.filter((n) => n.recipientId === currentUser?.id),
    [notifications, currentUser],
  );
  const unread = myNotifs.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading workspace…</div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="h-screen flex bg-background bg-mesh overflow-hidden">
      <CommandPalette />
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -left-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl dark:bg-primary/30"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-10 -right-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl dark:bg-accent/25"
        />

        <div className="relative px-5 h-16 flex items-center gap-2 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">GoalSync</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Enterprise OKRs
            </div>
          </div>
        </div>
        <div className="relative flex-1 overflow-y-auto scrollbar-sidebar px-3 py-4">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
          <nav className="space-y-0.5">
            {nav.map((item) => {
              const active = path === item.to || path.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-sidebar-accent text-foreground shadow-sm dark:shadow-glow dark:bg-gradient-to-r dark:from-primary/25 dark:to-accent/15 dark:border dark:border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-gradient-primary shadow-glow" />
                  )}
                  <Icon className={cn("h-4 w-4 transition-colors", active && "text-primary")} />
                  <span>{item.label}</span>
                  {item.to === "/approvals" && role === "manager" && (
                    <span className="ml-auto text-[10px] rounded-md px-1.5 py-0.5 bg-gradient-primary text-primary-foreground">
                      New
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quick links
          </div>
          <nav className="space-y-0.5">
            <Link
              to="/notifications"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span>Inbox</span>
              {unread > 0 && (
                <span className="ml-auto text-[10px] rounded-full px-1.5 bg-destructive text-destructive-foreground">
                  {unread}
                </span>
              )}
            </Link>
            <Link
              to="/cycles"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Cycles</span>
            </Link>
          </nav>
        </div>
        <div className="relative p-3 border-t border-sidebar-border">
          <div className="rounded-xl glass p-3 text-xs relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/15" />
            <div className="relative">
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <Sparkles className="h-3 w-3 text-primary" /> Annual Cycle
              </div>
              <div className="text-muted-foreground">FY26 · Mar – Apr review window</div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary shadow-glow" style={{ width: "72%" }} />
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">72% through the year</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border bg-card/70 backdrop-blur-xl sticky top-0 z-30">
          <div className="h-full px-4 lg:px-6 flex items-center gap-3">
            <div className="text-sm text-muted-foreground hidden md:flex items-center gap-1.5">
              <span>{currentUser.department}</span>
              <span className="opacity-40">/</span>
              <span className="text-foreground font-medium capitalize">
                {path.split("/").filter(Boolean).join(" / ") || "dashboard"}
              </span>
            </div>
            <div className="flex-1 max-w-md mx-auto">
              <button
                onClick={() =>
                  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
                }
                className="relative w-full text-left group"
                aria-label="Open command palette"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <div className="pl-9 pr-16 h-9 rounded-md bg-secondary/60 border border-transparent group-hover:border-primary/40 dark:group-hover:border-primary/60 text-sm text-muted-foreground flex items-center transition-all">
                  Search goals, people, jump to…
                </div>
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-1.5 inline-flex items-center gap-0.5 rounded border border-border text-[10px] text-muted-foreground bg-muted/60">
                  <Command className="h-3 w-3" />K
                </kbd>
              </button>
            </div>
            <ThemeToggle />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 flex items-center justify-between border-b">
                  <div className="font-medium text-sm">Notifications</div>
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-auto">
                  {myNotifs.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      You're all caught up.
                    </div>
                  )}
                  {myNotifs.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={cn(
                            "mt-1 h-2 w-2 rounded-full shrink-0",
                            n.read ? "bg-muted" : "bg-primary",
                          )}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{n.title}</div>
                          <div className="text-xs text-muted-foreground">{n.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                      {initials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-semibold leading-none">{currentUser.name}</div>
                    <div className="text-[10px] text-muted-foreground capitalize mt-0.5">
                      {currentUser.role}
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="font-semibold">{currentUser.name}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {currentUser.email}
                  </div>
                  <div className="mt-1.5">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {currentUser.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Switch demo persona
                </DropdownMenuLabel>
                {users
                  .filter((u) => ["u-emp", "u-mgr", "u-admin"].includes(u.id))
                  .map((u) => (
                    <DropdownMenuItem
                      key={u.id}
                      onClick={() => setCurrentUser(u.id)}
                      className="text-sm"
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-[10px]">{initials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-[10px] text-muted-foreground capitalize">{u.role}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate({ to: "/login" });
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-main">
          <div className="p-4 lg:p-8 max-w-[1500px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
