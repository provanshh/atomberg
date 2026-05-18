import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { Target } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create your GoalSync workspace" }, { name: "description", content: "Get started with GoalSync in minutes." }] }),
  component: SignupPage,
});

function SignupPage() {
  const { signup } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", role: "employee" as const, department: "Engineering", designation: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return toast.error("Name, email, and password are required");
    }
    setLoading(true);
    try {
      const u = await signup(form);
      toast.success(`Welcome, ${u.name.split(" ")[0]}!`);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-background bg-mesh">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center"><Target className="h-5 w-5 text-primary-foreground" /></div>
          <span className="font-semibold tracking-tight">GoalSync</span>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
          <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
          <p className="text-sm text-muted-foreground mt-1">Get started in less than a minute.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label>Full name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1.5" disabled={loading} required /></div>
            <div><Label>Work email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1.5" disabled={loading} required /></div>
            <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="mt-1.5" placeholder="••••••••" disabled={loading} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({...form, role: v as any})} disabled={loading}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin / HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Department</Label><Input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="mt-1.5" disabled={loading} /></div>
            </div>
            <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="mt-1.5" placeholder="e.g. Senior Engineer" disabled={loading} /></div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">Already have one? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}