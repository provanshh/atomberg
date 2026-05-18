import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("goalsync:v1");
        if (raw) {
          const s = JSON.parse(raw);
          if (s.currentUserId) throw redirect({ to: "/dashboard" });
        }
      } catch (e) {
        const maybeRedirect = e as { isRedirect?: boolean } | null;
        if (maybeRedirect?.isRedirect) throw e;
      }
    }
    throw redirect({ to: "/login" });
  },
});
