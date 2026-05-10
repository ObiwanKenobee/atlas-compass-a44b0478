import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, FileText, MapPin, Download, ArrowRight, Share2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { AnimatedCounter } from "@/components/atlas/AnimatedCounter";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/transparency")({
  head: () => ({
    meta: [
      { title: "Transparency Portal — Atlas Sanctum" },
      { name: "description", content: "Open ledger of fund allocation, verified milestones, monthly reports, and a global impact map." },
      { property: "og:title", content: "Transparency Portal — Atlas Sanctum" },
      { property: "og:description", content: "Every dollar tracked from intent to impact." },
    ],
  }),
  component: TransparencyPage,
});

type Project = {
  id: string;
  name: string;
  slug: string;
  country: string;
  category: string;
  raised_amount: number;
  goal_amount: number;
  beneficiaries: number;
  status: string;
  milestones: { label: string; done: boolean }[];
  lat: number | null;
  lng: number | null;
};

type Report = {
  id: string;
  month: string;
  headline: string;
  narrative: string | null;
  total_raised: number;
  total_distributed: number;
  beneficiaries_reached: number;
  allocations: Record<string, number>;
};

function TransparencyPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    supabase.from("projects").select("*").then(({ data }) => setProjects((data as unknown as Project[]) ?? []));
    supabase.from("monthly_reports").select("*").order("month", { ascending: false })
      .then(({ data }) => setReports((data as unknown as Report[]) ?? []));
  }, []);

  const totalRaised = projects.reduce((s, p) => s + Number(p.raised_amount), 0);
  const totalGoal = projects.reduce((s, p) => s + Number(p.goal_amount), 0);
  const totalBeneficiaries = projects.reduce((s, p) => s + p.beneficiaries, 0);
  const allMilestones = projects.flatMap((p) => p.milestones || []);
  const verified = allMilestones.filter((m) => m.done).length;

  // Aggregate allocation by category
  const byCategory: Record<string, number> = {};
  projects.forEach((p) => {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + Number(p.raised_amount);
  });
  const totalCat = Object.values(byCategory).reduce((s, n) => s + n, 0) || 1;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden bg-sacred grain py-24 text-ivory">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.82_0.15_85/0.18),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-midnight-deep/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
                  <ShieldCheck className="h-3 w-3" /> Transparency Portal
                </div>
                <h1 className="mt-6 font-display text-4xl font-semibold leading-tight md:text-6xl">
                  The trust <span className="font-serif italic text-gradient-gold">engine.</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg text-ivory/75">
                  Every dollar tracked from intent to impact. Verified by field teams, audited quarterly.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5">
                <KPI label="Total raised" value={<><span className="text-gold">$</span><AnimatedCounter to={Math.round(totalRaised)} /></>} />
                <KPI label="Active projects" value={<AnimatedCounter to={projects.length} />} />
                <KPI label="Verified milestones" value={<AnimatedCounter to={verified} />} />
                <KPI label="Beneficiaries reached" value={<AnimatedCounter to={totalBeneficiaries} />} />
              </div>
            </div>
          </div>
        </section>

        {/* Allocation */}
        <section className="border-b border-border bg-background py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Fund allocation</p>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">Where every dollar lands.</h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Live aggregation by mission across all active sanctums. Programs first, operations minimal.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-hope/10 px-4 py-2 text-sm font-medium text-hope">
                <CheckCircle2 className="h-4 w-4" /> 97¢ of every dollar reaches the field
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-6 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>Allocation by mission</span>
                <span>{Math.round(totalCat).toLocaleString()} USD</span>
              </div>
              {Object.entries(byCategory).map(([cat, val]) => {
                const pct = Math.round((val / totalCat) * 100);
                return (
                  <div key={cat} className="mb-4 last:mb-0">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize">{cat}</span>
                      <span className="font-medium">{pct}% · ${Math.round(val).toLocaleString()}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-gold-gradient" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Verified milestones */}
        <section className="border-b border-border bg-secondary/30 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Verified milestones</p>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">Proof, not promises.</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((p) => (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-6">
                  <Link to="/projects/$slug" params={{ slug: p.slug }} className="font-display text-lg font-semibold hover:text-foreground/80">
                    {p.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {p.country}
                  </div>
                  <div className="mt-4 space-y-2">
                    {(p.milestones || []).slice(0, 4).map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {m.done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-hope" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/30" />
                        )}
                        <span className={m.done ? "" : "text-muted-foreground"}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Monthly reports */}
        <section className="border-b border-border bg-background py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Monthly reports</p>
                <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">Open ledger, every month.</h2>
              </div>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {reports.map((r) => {
                const date = new Date(r.month);
                return (
                  <div key={r.id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </div>
                    <h3 className="mt-2 font-display text-xl font-semibold">{r.headline}</h3>
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{r.narrative}</p>

                    <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Raised</dt>
                        <dd className="mt-1 font-display text-base font-semibold">${Math.round(r.total_raised / 1000)}k</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Deployed</dt>
                        <dd className="mt-1 font-display text-base font-semibold">${Math.round(r.total_distributed / 1000)}k</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Reached</dt>
                        <dd className="mt-1 font-display text-base font-semibold">{r.beneficiaries_reached.toLocaleString()}</dd>
                      </div>
                    </dl>

                    <Button variant="ghost" className="mt-5 justify-between px-0 hover:bg-transparent">
                      <span className="text-sm"><FileText className="mr-2 inline h-4 w-4" /> Read full report</span>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Impact map */}
        <section className="bg-secondary/30 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Impact map</p>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">Sanctums across the world.</h2>
            <div className="relative mt-10 aspect-[2/1] overflow-hidden rounded-2xl border border-border bg-sacred grain">
              <WorldMap projects={projects} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to="/projects/$slug"
                  params={{ slug: p.slug }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-foreground/30"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-sacred">
                    <MapPin className="h-3.5 w-3.5 text-gold" />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.country}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function KPI({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ivory/10 bg-midnight-deep/40 p-6 backdrop-blur">
      <div className="font-display text-3xl font-semibold text-ivory">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-widest text-ivory/50">{label}</div>
    </div>
  );
}

function WorldMap({ projects }: { projects: Project[] }) {
  // Equirectangular projection: lng [-180,180] -> [0,100]%, lat [-90,90] -> [100,0]%
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 1000 500" className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none">
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`v${i}`} x1={(i + 1) * 55} y1={0} x2={(i + 1) * 55} y2={500} stroke="currentColor" className="text-gold/30" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={(i + 1) * 55} x2={1000} y2={(i + 1) * 55} stroke="currentColor" className="text-gold/30" strokeWidth="0.5" />
        ))}
      </svg>
      {projects.map((p) => {
        if (p.lat == null || p.lng == null) return null;
        const x = ((Number(p.lng) + 180) / 360) * 100;
        const y = ((90 - Number(p.lat)) / 180) * 100;
        return (
          <Link
            key={p.id}
            to="/projects/$slug"
            params={{ slug: p.slug }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className="relative grid place-items-center">
              <span className="absolute h-6 w-6 animate-pulse-glow rounded-full bg-gold/40" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-gold shadow-glow" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
