import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Copy, ExternalLink, ShieldCheck, CreditCard, Webhook, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/stripe")({
  head: () => ({ meta: [{ title: "Stripe enablement — Atlas Sanctum" }] }),
  component: StripeChecklistPage,
});

const STORAGE_KEY = "atlas.stripe.checklist.v1";

type Item = { id: string; label: string; desc: string; icon: any };
const ITEMS: Item[] = [
  { id: "account", label: "Create or sign in to a Stripe account", desc: "stripe.com/dashboard — confirm the business profile that will receive donations.", icon: CreditCard },
  { id: "secret_key", label: "Add STRIPE_SECRET_KEY", desc: "Developers → API keys → reveal the secret key. Paste it as a backend secret named STRIPE_SECRET_KEY.", icon: KeyRound },
  { id: "publishable_key", label: "Add STRIPE_PUBLISHABLE_KEY", desc: "Same screen — copy the publishable key. Safe in the browser; store as STRIPE_PUBLISHABLE_KEY.", icon: KeyRound },
  { id: "products", label: "Create one-time + monthly price IDs", desc: "Products → Add product. Create a 'Donation' price (custom amount, one-time) and a 'Monthly Guardian' recurring price.", icon: CreditCard },
  { id: "webhook", label: "Register the webhook endpoint", desc: "Use the URL below in Developers → Webhooks. Listen for checkout.session.completed and invoice.paid.", icon: Webhook },
  { id: "webhook_secret", label: "Add STRIPE_WEBHOOK_SECRET", desc: "After creating the webhook, reveal the signing secret and store it as STRIPE_WEBHOOK_SECRET.", icon: ShieldCheck },
  { id: "test", label: "Test a $1 donation in Stripe test mode", desc: "Use card 4242 4242 4242 4242. Confirm the donation row in the admin dashboard flips from pending → succeeded.", icon: CheckCircle2 },
];

function StripeChecklistPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate({ to: "/account" });
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {}
  }, [isAdmin, loading, navigate]);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/public/webhooks/stripe`
      : "/api/public/webhooks/stripe";

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success("Copied"); }
    catch { toast.error("Copy failed"); }
  };

  const completed = ITEMS.filter((i) => done[i.id]).length;
  const pct = Math.round((completed / ITEMS.length) * 100);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="pt-32 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-16">
        <section className="border-b border-border bg-sacred grain text-ivory">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-midnight-deep/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
              <CreditCard className="h-3 w-3" /> Stripe enablement
            </div>
            <h1 className="mt-6 font-display text-4xl font-semibold md:text-5xl">
              Wire payments when you're <span className="font-serif italic text-gradient-gold">ready.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-ivory/75">
              Donations are already being captured as <span className="text-gold">pending</span> records. Complete this checklist
              to flip the switch on real charges. Nothing here will charge anyone until every step is green.
            </p>
            <div className="mt-8 max-w-md">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-ivory/60">
                <span>Progress</span>
                <span>{completed} / {ITEMS.length}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ivory/10">
                <div className="h-full bg-gold-gradient transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-12">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-3">
                {ITEMS.map((item, i) => {
                  const Icon = item.icon;
                  const isDone = !!done[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-colors ${
                        isDone ? "border-hope/40 bg-hope/5" : "border-border bg-card hover:border-foreground/30"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-hope" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                          <Icon className="h-4 w-4 text-gold" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
                  <div className="text-xs uppercase tracking-widest text-gold">Webhook URL</div>
                  <div className="mt-2 break-all rounded-lg bg-midnight-deep/5 p-3 font-mono text-xs">{webhookUrl}</div>
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => copy(webhookUrl)}>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Copy URL
                  </Button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Paste this into Stripe → Developers → Webhooks. Subscribe to <span className="font-mono">checkout.session.completed</span>{" "}
                    and <span className="font-mono">invoice.paid</span>.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 text-sm">
                  <div className="font-display text-base font-semibold">Required secrets</div>
                  <ul className="mt-3 space-y-2 text-xs">
                    <li className="rounded-md bg-secondary/60 px-2 py-1.5 font-mono">STRIPE_SECRET_KEY</li>
                    <li className="rounded-md bg-secondary/60 px-2 py-1.5 font-mono">STRIPE_PUBLISHABLE_KEY</li>
                    <li className="rounded-md bg-secondary/60 px-2 py-1.5 font-mono">STRIPE_WEBHOOK_SECRET</li>
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Ask Lovable to "store these as backend secrets" and paste each value into the secure prompt — they never enter the codebase.
                  </p>
                </div>

                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">
                    Open Stripe dashboard <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </a>

                <Link to="/admin">
                  <Button variant="ghost" className="w-full">← Back to admin console</Button>
                </Link>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
