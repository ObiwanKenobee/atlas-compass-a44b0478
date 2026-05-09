import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Active Sanctums — Atlas Sanctum Projects" },
      { name: "description", content: "Explore active humanitarian projects: schools, kitchens, healing circles, water systems, and shelter — across 27 countries." },
      { property: "og:title", content: "Active Sanctums — Atlas Sanctum" },
      { property: "og:description", content: "Every sanctum is a place where children are seen, fed, taught, and healed." },
    ],
  }),
  component: ProjectsPage,
});

type Project = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  country: string;
  region: string | null;
  category: string;
  image_url: string | null;
  goal_amount: number;
  raised_amount: number;
  beneficiaries: number;
  status: string;
};

const CATEGORIES = ["all", "education", "nutrition", "healing", "shelter", "water"] as const;

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("all");
  const [region, setRegion] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    supabase
      .from("projects")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProjects((data as Project[]) ?? []);
        setLoading(false);
      });
  }, []);

  const regions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.region && set.add(p.region));
    return ["all", ...Array.from(set)];
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (region !== "all" && p.region !== region) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.country.toLowerCase().includes(q) && !p.summary.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [projects, category, region, query]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-16">
        <section className="border-b border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Active Sanctums</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-6xl">
              Projects in <span className="font-serif italic">motion.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Each sanctum is a place where children are seen, fed, taught, and healed. Pick one to support — every dollar is traced from intent to impact.
            </p>
          </div>
        </section>

        <section className="border-b border-border bg-background py-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, country, or summary…"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
                    category === c
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "All regions" : r}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="bg-background py-16">
          <div className="mx-auto max-w-7xl px-6">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-secondary" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
                No sanctums match your filters yet.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const pct = Math.min(100, Math.round((Number(project.raised_amount) / Math.max(1, Number(project.goal_amount))) * 100));
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-elegant"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {project.image_url && (
          <img
            src={project.image_url}
            alt={project.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
          />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest backdrop-blur">
          {project.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {project.country}
          {project.region && <span> · {project.region}</span>}
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold leading-tight">{project.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.summary}</p>

        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="font-display text-lg font-semibold">${Number(project.raised_amount).toLocaleString()}</div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                raised of ${Number(project.goal_amount).toLocaleString()}
              </div>
            </div>
            <div className="text-sm font-medium text-hope">{pct}%</div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-gold-gradient transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{project.beneficiaries.toLocaleString()} beneficiaries</span>
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              Open <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
