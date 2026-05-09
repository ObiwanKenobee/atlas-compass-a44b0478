import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-sacred">
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
            <span className="font-display text-lg font-semibold">
              Atlas <span className="text-gradient-gold">Sanctum</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            A humanitarian command center for compassion. Building sanctuaries for
            children facing unimaginable hardship — across 27 countries.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Engage</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/projects" className="hover:text-foreground">Projects</Link></li>
            <li><Link to="/donate" className="hover:text-foreground">Donate</Link></li>
            <li><Link to="/volunteer" className="hover:text-foreground">Volunteer</Link></li>
            <li><Link to="/transparency" className="hover:text-foreground">Transparency</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Account</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/signup" className="hover:text-foreground">Become a Guardian</Link></li>
            <li><Link to="/account" className="hover:text-foreground">My account</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Atlas Sanctum. A citadel of charity.</span>
          <span>Verified · Audited · Open ledger</span>
        </div>
      </div>
    </footer>
  );
}
