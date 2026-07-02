import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isCurrentUserAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/admin/auth")({
  ssr: false,
  component: AdminAuthPage,
});

function AdminAuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const isAdmin = await isCurrentUserAdmin();
      if (isAdmin) navigate({ to: "/admin", replace: true });
    })();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }
    const isAdmin = await isCurrentUserAdmin();
    setLoading(false);
    if (!isAdmin) {
      await supabase.auth.signOut();
      return toast.error("This account does not have admin access.");
    }
    toast.success("Welcome, admin");
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Admin Portal</span>
        </Link>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-lg font-semibold">Admin sign in</h1>
            <p className="text-sm text-muted-foreground">
              Restricted access. Admin credentials required.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="a-email">Email</Label>
              <Input
                id="a-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-password">Password</Label>
              <Input
                id="a-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in as admin"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Not an admin?{" "}
            <Link to="/auth" className="underline underline-offset-2">
              Regular sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
