import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Search,
  ShieldCheck,
  Filter,
  ExternalLink,
  Mail,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/admin/donations")({
  head: () => ({ meta: [{ title: "Donations — Atlas Sanctum Admin" }] }),
  component: AdminDonationsPage,
});

type Donation = {
  id: string;
  amount: number;
  currency: string;
  donation_type: string;
  donor_name: string | null;
  donor_email: string | null;
  message: string | null;
  anonymous: boolean;
  status: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  receipt_url: string | null;
  failure_reason: string | null;
  confirmed_at: string | null;
  created_at: string;
  project_id: string | null;
};

type StripeEvent = {
  id: string;
  event_id: string;
  type: string;
  payload: any;
  created_at: string;
};

const STATUS_FILTERS = ["all", "pending", "succeeded", "failed", "refunded"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function AdminDonationsPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [projectsById, setProjectsById] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "one_time" | "monthly">("all");
  const [selected, setSelected] = useState<Donation | null>(null);
  const [events, setEvents] = useState<StripeEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate({ to: "/account" });
      return;
    }
    supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => setDonations((data as Donation[]) ?? []));
    supabase
      .from("projects")
      .select("id, name")
      .then(({ data }) => {
        const m: Record<string, string> = {};
        (data ?? []).forEach((p: any) => (m[p.id] = p.name));
        setProjectsById(m);
      });
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (!selected) {
      setEvents([]);
      return;
    }
    setEventsLoading(true);
    supabase
      .from("stripe_events")
      .select("*")
      .eq("donation_id", selected.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setEvents((data as StripeEvent[]) ?? []);
        setEventsLoading(false);
      });
  }, [selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return donations.filter((d) => {
      if (status !== "all" && d.status !== status) return false;
      if (type !== "all" && d.donation_type !== type) return false;
      if (q) {
        const hay = [
          d.donor_name,
          d.donor_email,
          d.stripe_session_id,
          d.stripe_payment_intent_id,
          d.id,
          projectsById[d.project_id ?? ""],
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [donations, status, type, search, projectsById]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: donations.length, pending: 0, succeeded: 0, failed: 0, refunded: 0 };
    for (const d of donations) c[d.status] = (c[d.status] ?? 0) + 1;
    return c;
  }, [donations]);

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
          <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-6 py-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-midnight-deep/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
                <Heart className="h-3 w-3" /> Donations
              </div>
              <h1 className="mt-4 font-display text-3xl font-semibold md:text-4xl">All gifts.</h1>
              <p className="mt-2 text-sm text-ivory/70">{donations.length} records · click any row for the Stripe event timeline.</p>
            </div>
            <Link to="/admin">
              <Button variant="outline" className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10">
                ← Admin console
              </Button>
            </Link>
          </div>
        </section>

        <section className="bg-background py-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      status === s ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/50"
                    }`}
                  >
                    {s}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${status === s ? "bg-background/20" : "bg-secondary"}`}>{counts[s] ?? 0}</span>
                  </button>
                ))}
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="rounded-md border border-border bg-card px-3 py-2 text-xs"
                >
                  <option value="all">All types</option>
                  <option value="one_time">One-time</option>
                  <option value="monthly">Monthly</option>
                </select>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, IDs…"
                    className="h-9 w-64 pl-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Donor</th>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          <Filter className="mx-auto mb-2 h-4 w-4" /> No donations match this filter.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((d) => (
                        <tr
                          key={d.id}
                          onClick={() => setSelected(d)}
                          className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40"
                        >
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(d.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{d.anonymous ? "Anonymous" : d.donor_name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{d.donor_email}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {d.project_id ? projectsById[d.project_id] ?? "—" : "Where needed most"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">${Number(d.amount).toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{d.donation_type.replace("_", " ")}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={d.status} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm">View →</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">
                  ${Number(selected.amount).toLocaleString()}
                  <span className="ml-2 align-middle text-base font-normal text-muted-foreground capitalize">
                    {selected.donation_type.replace("_", " ")}
                  </span>
                </SheetTitle>
                <SheetDescription>
                  {selected.anonymous ? "Anonymous Guardian" : selected.donor_name || "—"} ·{" "}
                  {new Date(selected.created_at).toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <StatusBadge status={selected.status} />
                  {selected.failure_reason && (
                    <span className="text-xs text-alert">{selected.failure_reason}</span>
                  )}
                </div>

                <DetailGrid>
                  <Detail label="Donor email" value={selected.donor_email ?? "—"} icon={Mail} />
                  <Detail
                    label="Project"
                    value={selected.project_id ? projectsById[selected.project_id] ?? selected.project_id : "Where needed most"}
                  />
                  <Detail label="Confirmed at" value={selected.confirmed_at ? new Date(selected.confirmed_at).toLocaleString() : "—"} icon={Clock} />
                  <Detail
                    label="Receipt"
                    value={
                      selected.receipt_url ? (
                        <a href={selected.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        "—"
                      )
                    }
                    icon={Receipt}
                  />
                  <Detail label="Donation ID" value={<code className="text-xs">{selected.id}</code>} mono />
                  <Detail label="Session" value={selected.stripe_session_id ?? "—"} mono />
                  <Detail label="Payment intent" value={selected.stripe_payment_intent_id ?? "—"} mono />
                  <Detail label="Invoice" value={selected.stripe_invoice_id ?? "—"} mono />
                  <Detail label="Subscription" value={selected.stripe_subscription_id ?? "—"} mono />
                </DetailGrid>

                {selected.message && (
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Donor note</div>
                    <p className="mt-2 font-serif text-base italic">"{selected.message}"</p>
                  </div>
                )}

                <div>
                  <h3 className="mb-3 font-display text-lg font-semibold">Stripe event history</h3>
                  {eventsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : events.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      No Stripe events yet — gift is{" "}
                      <span className="font-medium text-foreground">{selected.status}</span>. Events will appear here once
                      the webhook receives activity for this donation.
                    </div>
                  ) : (
                    <ol className="relative space-y-4 border-l border-border pl-5">
                      {events.map((ev) => (
                        <li key={ev.id} className="relative">
                          <span className="absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full border border-border bg-background">
                            <EventIcon type={ev.type} />
                          </span>
                          <div className="font-mono text-xs">{ev.type}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(ev.created_at).toLocaleString()} · {ev.event_id}
                          </div>
                          <details className="mt-1">
                            <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">View payload</summary>
                            <pre className="mt-2 max-h-60 overflow-auto rounded-md bg-secondary/60 p-3 text-[10px] leading-relaxed">
                              {JSON.stringify(ev.payload, null, 2)}
                            </pre>
                          </details>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    succeeded: { cls: "bg-hope/15 text-hope border-hope/30", label: "Succeeded" },
    pending: { cls: "bg-secondary text-foreground border-border", label: "Pending" },
    failed: { cls: "bg-alert/15 text-alert border-alert/30", label: "Failed" },
    refunded: { cls: "bg-muted text-muted-foreground border-border", label: "Refunded" },
  };
  const m = map[status] ?? { cls: "bg-secondary text-foreground border-border", label: status };
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

function EventIcon({ type }: { type: string }) {
  if (type.includes("failed")) return <XCircle className="h-2.5 w-2.5 text-alert" />;
  if (type.includes("refund")) return <RotateCcw className="h-2.5 w-2.5 text-muted-foreground" />;
  if (type.includes("paid") || type.includes("completed") || type.includes("succeeded"))
    return <CheckCircle2 className="h-2.5 w-2.5 text-hope" />;
  return <Clock className="h-2.5 w-2.5 text-muted-foreground" />;
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">{children}</dl>;
}
function Detail({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  icon?: any;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </dt>
      <dd className={`mt-1 break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
