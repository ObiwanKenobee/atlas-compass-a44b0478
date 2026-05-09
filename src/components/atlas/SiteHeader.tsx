import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, Heart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";
import * as React from "react";

const NAV = [
  { label: "Projects", to: "/projects" },
  { label: "Transparency", to: "/transparency" },
  { label: "Volunteer", to: "/volunteer" },
];

export function SiteHeader({ variant = "light" }: { variant?: "light" | "overlay" }) {
  const { isAuthenticated, isAdmin, signOut } = useAuth();
  const [open, setOpen] = React.useState(false);
  const { location } = useRouterState();
  React.useEffect(() => setOpen(false), [location.pathname]);

  const overlay = variant === "overlay";

  return (
    <header
      className={`fixed top-0 z-50 w-full backdrop-blur-xl ${
        overlay
          ? "border-b border-ivory/10 bg-midnight-deep/40 text-ivory"
          : "border-b border-border/40 bg-background/80 text-foreground"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-sacred shadow-glow">
            <Sparkles className="h-4 w-4 text-gold" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Atlas <span className="text-gradient-gold">Sanctum</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`text-sm transition-colors ${
                overlay ? "text-ivory/70 hover:text-ivory" : "text-muted-foreground hover:text-foreground"
              }`}
              activeProps={{ className: overlay ? "text-gold" : "text-foreground font-medium" }}
            >
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`text-sm ${overlay ? "text-gold" : "text-foreground"} font-medium`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <Link to="/account">
                <Button variant="ghost" size="sm" className={overlay ? "text-ivory hover:bg-ivory/10" : ""}>
                  Account
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className={overlay ? "text-ivory/70 hover:bg-ivory/10" : ""}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className={overlay ? "text-ivory hover:bg-ivory/10" : ""}>
                Sign in
              </Button>
            </Link>
          )}
          <Link to="/donate">
            <Button size="sm" className="bg-gold-gradient text-midnight-deep shadow-glow hover:opacity-95">
              <Heart className="mr-1.5 h-3.5 w-3.5" /> Donate
            </Button>
          </Link>
        </div>

        <button
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
          className="md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className={`md:hidden ${overlay ? "bg-midnight-deep text-ivory" : "bg-background"} border-t border-border/40 px-6 py-4`}>
          <div className="flex flex-col gap-3">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="py-1 text-sm">
                {n.label}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" className="py-1 text-sm font-medium">Admin</Link>}
            {isAuthenticated ? (
              <>
                <Link to="/account" className="py-1 text-sm">Account</Link>
                <button onClick={() => signOut()} className="py-1 text-left text-sm">Sign out</button>
              </>
            ) : (
              <Link to="/login" className="py-1 text-sm">Sign in</Link>
            )}
            <Link to="/donate">
              <Button size="sm" className="mt-2 w-full bg-gold-gradient text-midnight-deep">
                <Heart className="mr-1.5 h-3.5 w-3.5" /> Donate
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
