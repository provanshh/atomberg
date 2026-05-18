import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — GoalSync" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-background bg-mesh">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center"><Target className="h-5 w-5 text-primary-foreground" /></div>
          <span className="font-semibold tracking-tight">GoalSync</span>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
          <h2 className="text-2xl font-semibold tracking-tight">Reset your password</h2>
          <p className="text-sm text-muted-foreground mt-1">We'll send you a secure link to choose a new password.</p>
          {sent ? (
            <div className="mt-6 p-4 rounded-lg bg-success/10 text-success text-sm">If <b>{email}</b> matches an account, a reset link is on its way.</div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); toast.success("Reset link sent"); }} className="mt-6 space-y-4">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" /></div>
              <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">Send reset link</Button>
            </form>
          )}
          <div className="mt-4 text-center text-sm"><Link to="/login" className="text-primary hover:underline">Back to sign in</Link></div>
        </div>
      </div>
    </div>
  );
}