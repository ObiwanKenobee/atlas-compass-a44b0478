import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, ArrowRight, CheckCircle2, Circle, Heart, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projects/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Atlas Sanctum` },
      { name: "description", content: "An Atlas Sanctum project — verified, traced, and trusted." },
    ],
  }),
  component: ProjectDetail,
});

type Milestone = { label: string; done: boolean };
type Project = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string | null;
  country: string;
  region: string | null;
  category: string;
  image_url: string | null;
  goal_amount: number;
  raised_amount: number;
  beneficiaries: number;
  status: string;
  milestones: Milestone[];
  fund_allocation: Record<string, number>;
};

function ProjectDetail() {
  const { slug } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setMissing(true);
        else setProject(data as unknown as Project);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-5xl animate-pulse px-6 pt-32">
          <div className="h-8 w-2/3 rounded bg-secondary" />
          <div className="mt-6 aspect-video rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }
  if (missing || !project) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 pt-32 text-center">
          <h1 className="font-display text-4xl font-semibold">Sanctum not found</h1>
          <p className="mt-4 text-muted-foreground">This sanctum may have been completed or moved.</p>
          <Link to="/projects" className="mt-8 inline-block">
            <Button>Back to all sanctums</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((Number(project.raised_amount) / Math.max(1, Number(project.goal_amount))) * 100));
  const completed = project.milestones?.filter((m) => m.done).length ?? 0;
  const totalMs = project.milestones?.length ?? 0;
  const allocations = Object.entries(project.fund_allocation || {});

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="overlay" />
      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-sacred pt-16 text-ivory">
          {project.image_url && (
            <img src={project.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-luminosity" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-midnight-deep/70 via-midnight-deep/50 to-midnight-deep" />
          <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24">
            <Link to="/projects" className="text-xs uppercase tracking-widest text-gold/80 hover:text-gold">
              ← All sanctums
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest">
              <span className="rounded-full border border-gold/30 bg-midnight-deep/50 px-3 py-1 text-gold">{project.category}</span>
              <span className="flex items-center gap-1 text-ivory/70">
                <MapPin className="h-3 w-3" /> {project.country}
                {project.region && <span> · {project.region}</span>}
              </span>
              <span className="text-ivory/50">Status: {project.status}</span>
            </div>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight md:text-6xl">{project.name}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ivory/80">{project.summary}</p>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:grid-cols-4">
            <Stat icon={Target} label="Goal" value={`$${Number(project.goal_amount).toLocaleString()}`} />
            <Stat icon={Heart} label="Raised" value={`$${Number(project.raised_amount).toLocaleString()}`} sub={`${pct}% funded`} />
            <Stat icon={Users} label="Beneficiaries" value={project.beneficiaries.toLocaleString()} />
            <Stat icon={CheckCircle2} label="Milestones" value={`${completed} / ${totalMs}`} />
          </div>
        </section>

        <section className="bg-background py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="font-display text-2xl font-semibold">The story</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                {project.description || project.summary}
              </p>

              <h2 className="mt-12 font-display text-2xl font-semibold">Verified milestones</h2>
              <div className="mt-6 space-y-3">
                {project.milestones?.map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 rounded-xl border p-4 ${
                      m.done ? "border-hope/30 bg-hope/5" : "border-border bg-card"
                    }`}
                  >
                    {m.done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-hope" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <span className={`text-sm ${m.done ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</span>
                    {m.done && (
                      <span className="ml-auto text-[10px] uppercase tracking-widest text-hope">Verified</span>
                    )}
                  </div>
                ))}
              </div>

              {allocations.length > 0 && (
                <>
                  <h2 className="mt-12 font-display text-2xl font-semibold">Fund allocation</h2>
                  <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                    {allocations.map(([key, val]) => (
                      <div key={key} className="mb-4 last:mb-0">
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="font-medium">{val}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-gold-gradient" style={{ width: `${val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="font-display text-3xl font-semibold">${Number(project.raised_amount).toLocaleString()}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  raised of ${Number(project.goal_amount).toLocaleString()}
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gold-gradient transition-all duration-1000" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 text-sm font-medium text-hope">{pct}% funded</div>

                <Link to="/donate" search={{ project: project.slug } as never}>
                  <Button size="lg" className="mt-6 w-full bg-gold-gradient text-midnight-deep shadow-glow hover:opacity-95">
                    <Heart className="mr-2 h-4 w-4" /> Donate to this sanctum
                  </Button>
                </Link>
                <Link to="/donate" search={{ project: project.slug, monthly: 1 } as never}>
                  <Button size="lg" variant="outline" className="mt-3 w-full">
                    Sponsor monthly <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  97¢ of every dollar reaches the field. All milestones are verified by our independent field auditors.
                </p>
              </div>
            </aside>
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
      {sub && <div className="mt-1 text-xs text-hope">{sub}</div>}
    </div>
  );
}
