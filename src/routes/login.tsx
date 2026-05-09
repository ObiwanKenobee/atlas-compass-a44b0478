import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Atlas Sanctum" },
      { name: "description", content: "Sign in to your Atlas Sanctum Guardian account." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
});

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/account" });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back, Guardian.");
    navigate({ to: "/account" });
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/account" },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-sacred grain p-12 text-ivory md:flex md:flex-col md:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-midnight-deep/50">
            <Sparkles className="h-4 w-4 text-gold" />
          </div>
          <span className="font-display text-lg font-semibold">
            Atlas <span className="text-gradient-gold">Sanctum</span>
          </span>
        </Link>
        <div>
          <p className="font-serif text-3xl italic leading-snug text-ivory/90">
            "Every gift becomes a measurable thread in the fabric of dignity."
          </p>
          <p className="mt-6 text-sm uppercase tracking-widest text-gold">A citadel of charity</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue your guardianship.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-foreground text-background hover:bg-foreground/90">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle}>
            Continue with Google
          </Button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
              Become a Guardian
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
