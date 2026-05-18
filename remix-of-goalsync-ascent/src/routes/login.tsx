import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { Target, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — GoalSync" }, { name: "description", content: "Sign in to GoalSync to plan and track goals across your team." }] }),
  component: LoginPage,
});

const PERSONAS = [
  { email: "employee@goalsync.com", role: "Employee", name: "Jordan Lee" },
  { email: "manager@goalsync.com", role: "Manager", name: "Daniel Hayes" },
  { email: "admin@goalsync.com", role: "Admin / HR", name: "Priya Sharma" },
];

function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("employee@goalsync.com");
  const [password, setPassword] = useState("demo");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      if (!u) {
        toast.error("Account not found. Try a demo persona below.");
        return;
      }
      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in. Please verify the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative bg-gradient-primary p-12 flex-col justify-between text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur grid place-items-center"><Target className="h-5 w-5" /></div>
            <span className="font-semibold tracking-tight">GoalSync</span>
          </div>
        </div>
        <div className="relative space-y-6 max-w-md">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-xs"><Sparkles className="h-3 w-3" /> Goal Setting · Check-ins · Analytics</div>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">The operating system for enterprise goals.</h1>
          <p className="text-primary-foreground/80">Align every employee, manager, and HR partner around the same outcomes — from goal setting in May to your annual review in April.</p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[["1,200+","Users"],["96%","Adoption"],["4.9","CSAT"]].map(([v,l]) => (
              <div key={l} className="rounded-xl bg-white/10 backdrop-blur p-3"><div className="text-2xl font-semibold">{v}</div><div className="text-xs opacity-80">{l}</div></div>
            ))}
          </div>
        </div>
        <div className="relative text-xs opacity-80">© {new Date().getFullYear()} GoalSync. SOC 2 Type II · ISO 27001</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center"><Target className="h-5 w-5 text-primary-foreground" /></div>
            <span className="font-semibold tracking-tight">GoalSync</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in to your workspace</h2>
          <p className="text-sm text-muted-foreground mt-1">Use a demo persona below or your credentials.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="mt-1.5" />
            </div>
            <div>
              <div className="flex justify-between items-end">
                <Label htmlFor="pw">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
              </div>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} className="mt-1.5" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 bg-gradient-primary text-primary-foreground hover:opacity-90">
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-background px-2 text-muted-foreground">or</span></div>
            </div>
            <Button type="button" variant="outline" className="w-full h-10" onClick={() => toast.info("Microsoft Entra ID SSO would launch here.") }>
              <svg viewBox="0 0 23 23" className="h-4 w-4 mr-2"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#7fba00" d="M12 1h10v10H12z"/><path fill="#00a4ef" d="M1 12h10v10H1z"/><path fill="#ffb900" d="M12 12h10v10H12z"/></svg>
              Continue with Microsoft Entra ID
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-border p-3 bg-secondary/40">
            <div className="text-xs font-semibold mb-2">Demo personas</div>
            <div className="space-y-1">
              {PERSONAS.map((p) => (
                <button key={p.email} type="button" onClick={() => setEmail(p.email)} className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded-md hover:bg-card">
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.email}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.role}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-6 text-center">Don't have an account? <Link to="/signup" className="text-primary hover:underline">Create one</Link></p>
        </div>
      </div>
    </div>
  );
}