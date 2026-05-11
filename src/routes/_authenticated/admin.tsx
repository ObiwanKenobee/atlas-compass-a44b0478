import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Users, Target, ShieldCheck, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Atlas Sanctum" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate({ to: "/account" });
      return;
    }
    Promise.all([
      supabase.from("donations").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("volunteer_applications").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
    ]).then(([d, a, p]) => {
      setDonations(d.data ?? []);
      setApplications(a.data ?? []);
      setProjects(p.data ?? []);
      setDataLoading(false);
    });
  }, [isAdmin, loading, navigate]);

  const totalRaised = donations
    .filter((d) => d.status === "succeeded")
    .reduce((s, d) => s + Number(d.amount), 0);
  const pending = donations.filter((d) => d.status === "pending").length;
  const monthly = donations.filter((d) => d.donation_type === "monthly" && d.status === "succeeded").length;

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
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-midnight-deep/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
                  <ShieldCheck className="h-3 w-3" /> Admin Console
                </div>
                <h1 className="mt-6 font-display text-4xl font-semibold md:text-5xl">Citadel control.</h1>
                <p className="mt-3 text-sm text-ivory/70">
                  Donations currently save as <span className="text-gold">pending</span> until Stripe is wired.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/admin/stripe">
                  <Button className="bg-gold-gradient text-midnight-deep shadow-glow hover:opacity-95">
                    Stripe →
                  </Button>
                </Link>
                <Link to="/admin/donations">
                  <Button variant="outline" className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10">
                    Donations →
                  </Button>
                </Link>
                <Link to="/admin/reports">
                  <Button variant="outline" className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10">
                    <FileText className="mr-1.5 h-3.5 w-3.5" /> Reports
                  </Button>
                </Link>
                <Link to="/admin/email">
                  <Button variant="outline" className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10">
                    <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background py-10">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-4">
            <Stat icon={Heart} label="Total raised (succeeded)" value={`$${totalRaised.toLocaleString()}`} />
            <Stat icon={FileText} label="Pending donations" value={String(pending)} sub="awaiting Stripe activation" />
            <Stat icon={Target} label="Active monthly donors" value={String(monthly)} />
            <Stat icon={Users} label="Volunteer applications" value={String(applications.length)} />
          </div>
        </section>

        <section className="bg-background py-12">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
            <Panel title={`Recent donations (${donations.length})`}>
              {dataLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : donations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No donations yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="pb-2">Date</th><th className="pb-2">Donor</th><th className="pb-2">Amount</th><th className="pb-2">Type</th><th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.slice(0, 10).map((d) => (
                      <tr key={d.id} className="border-t border-border">
                        <td className="py-2 text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                        <td className="py-2">{d.anonymous ? "Anonymous" : d.donor_name || d.donor_email}</td>
                        <td className="py-2 font-medium">${Number(d.amount).toLocaleString()}</td>
                        <td className="py-2 text-xs capitalize text-muted-foreground">{d.donation_type.replace("_", " ")}</td>
                        <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${d.status === "succeeded" ? "bg-hope/15 text-hope" : d.status === "pending" ? "bg-secondary" : "bg-alert/15 text-alert"}`}>{d.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel title={`Volunteer applications (${applications.length})`}>
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No applications yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {applications.slice(0, 10).map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <div className="font-medium">{a.full_name}</div>
                        <div className="text-xs text-muted-foreground">{a.skills?.slice(0, 3).join(", ")} · {a.regions?.slice(0, 2).join(", ")}</div>
                      </div>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{a.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title={`Projects (${projects.length})`} className="lg:col-span-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <th className="pb-2">Project</th><th className="pb-2">Country</th><th className="pb-2">Raised</th><th className="pb-2">Goal</th><th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="py-2 font-medium">
                        <Link to="/projects/$slug" params={{ slug: p.slug }} className="hover:underline">{p.name}</Link>
                      </td>
                      <td className="py-2 text-muted-foreground">{p.country}</td>
                      <td className="py-2">${Number(p.raised_amount).toLocaleString()}</td>
                      <td className="py-2 text-muted-foreground">${Number(p.goal_amount).toLocaleString()}</td>
                      <td className="py-2 text-xs capitalize">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <Icon className="h-4 w-4 text-gold" />
      <div className="mt-3 font-display text-2xl font-semibold">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 ${className}`}>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </div>
  );
}
