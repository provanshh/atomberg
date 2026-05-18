import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("goalsync_access_token");
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppShell,
});