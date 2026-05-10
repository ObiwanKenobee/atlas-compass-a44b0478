import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatedCounter } from "@/components/atlas/AnimatedCounter";
import { Globe } from "@/components/atlas/Globe";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import heroImg from "@/assets/hero.jpg";
import story1 from "@/assets/story-1.jpg";
import story2 from "@/assets/story-2.jpg";
import story3 from "@/assets/story-3.jpg";
import {
  ArrowRight,
  Heart,
  Sparkles,
  ShieldCheck,
  Globe2,
  Users,
  BookOpen,
  Utensils,
  HandHeart,
  CheckCircle2,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas Sanctum — Citadel of Charity" },
      {
        name: "description",
        content:
          "Building sanctuaries for children facing unimaginable hardship. Education, health, inclusion, and healing at planetary scale.",
      },
      { property: "og:title", content: "Atlas Sanctum — Citadel of Charity" },
      {
        property: "og:description",
        content:
          "A humanitarian command center for compassion. Donate, sponsor, volunteer.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <ImpactStrip />
        <Stories />
        <Projects />
        <Transparency />
        <Testimonials />
        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-sacred grain pt-16 text-ivory">
      <img
        src={heroImg}
        alt=""
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-luminosity"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-midnight-deep/60 via-midnight-deep/40 to-midnight-deep" />
      <Globe className="pointer-events-none absolute -right-32 top-10 h-[700px] w-[700px] opacity-70 md:opacity-90" />

      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 pb-32 pt-24 md:pt-36 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-midnight-deep/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-gold" />
            A citadel of charity
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Building sanctuaries for{" "}
            <span className="font-serif italic text-gradient-gold">children</span>{" "}
            facing unimaginable hardship.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory/75">
            Education, health, inclusion and healing at planetary scale. Atlas Sanctum is a humanitarian command center —
            where every gift is traceable, every story is honored, and every child is seen.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/donate">
              <Button size="lg" className="bg-gold-gradient text-midnight-deep shadow-glow hover:opacity-95">
                <Heart className="mr-2 h-4 w-4" /> Donate now
              </Button>
            </Link>
            <Link to="/projects">
              <Button size="lg" variant="outline" className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10">
                Explore projects <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/volunteer" className="text-sm text-ivory/70 underline-offset-4 hover:text-gold hover:underline">
              Become a Guardian →
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-widest text-ivory/40">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> Verified Reports</span>
            <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-gold" /> 27 Countries</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /> 12,400 Guardians</span>
          </div>
        </div>
      </div>

      {/* Live impact strip */}
      <div className="relative border-t border-ivory/10 bg-midnight-deep/50 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-y divide-ivory/10 px-6 md:grid-cols-5 md:divide-x md:divide-y-0">
          {[
            { label: "Children supported", to: 84230 },
            { label: "Meals delivered", to: 2_140_000, suffix: "" },
            { label: "Learning hours funded", to: 568_400 },
            { label: "Communities reached", to: 312 },
            { label: "Active sanctums", to: 47 },
          ].map((m) => (
            <div key={m.label} className="px-4 py-6 md:px-6 md:py-7">
              <div className="font-display text-2xl font-semibold text-gold md:text-3xl">
                <AnimatedCounter to={m.to} />
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-widest text-ivory/50">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Impact Strip / Mission ---------- */
function ImpactStrip() {
  const pillars = [
    { icon: BookOpen, title: "Education", desc: "Schools, scholarships and digital academies for children left behind." },
    { icon: Utensils, title: "Nutrition", desc: "Daily meals and clean water in communities facing scarcity." },
    { icon: HandHeart, title: "Healing", desc: "Trauma recovery, mental health and inclusion for the most vulnerable." },
    { icon: ShieldCheck, title: "Transparency", desc: "Open ledgers, verified milestones, satellite-confirmed outcomes." },
  ];
  return (
    <section id="mission" className="relative bg-background py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-2 md:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.24em] text-muted-foreground">Our Mission</p>
            <h2 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
              Restoration, made <span className="font-serif italic text-foreground/80">visible.</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground">
            We design sanctuaries — schools, clinics, kitchens, safe houses — and weave them into a global network
            so that every gift becomes a measurable thread in the fabric of dignity.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-border md:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="group bg-card p-8 transition-colors hover:bg-secondary">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-lg bg-sacred text-gold shadow-card">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Stories ---------- */
function Stories() {
  const stories = [
    {
      img: story1,
      tag: "Child Journey",
      name: "Amina, 9 — Nairobi",
      quote: "I want to be a doctor. The sanctum gave me books, meals, and time to dream.",
      progress: 78,
    },
    {
      img: story2,
      tag: "Community",
      name: "Sundarbans Village",
      quote: "Where the floods took everything, the kitchens kept us alive.",
      progress: 64,
    },
    {
      img: story3,
      tag: "Volunteer",
      name: "Mateo — Teacher",
      quote: "Six months in the field rewired what I thought a classroom could be.",
      progress: 92,
    },
  ];
  return (
    <section id="stories" className="relative bg-secondary/40 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">Stories</p>
            <h2 className="font-display text-4xl font-semibold md:text-5xl">
              Lives, not <span className="font-serif italic">numbers.</span>
            </h2>
          </div>
          <Link to="/projects" className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
            All stories <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {stories.map((s) => (
            <article
              key={s.name}
              className="group overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={s.img}
                  alt={s.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-deep/90 via-midnight-deep/20 to-transparent" />
                <span className="absolute left-5 top-5 rounded-full border border-ivory/20 bg-midnight-deep/40 px-3 py-1 text-[10px] uppercase tracking-widest text-ivory backdrop-blur">
                  {s.tag}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                  <p className="font-serif text-lg italic leading-snug">"{s.quote}"</p>
                  <p className="mt-3 text-xs uppercase tracking-widest text-gold">{s.name}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Mission funded</span>
                  <span className="font-medium text-foreground">{s.progress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gold-gradient" style={{ width: `${s.progress}%` }} />
                </div>
                <Button variant="ghost" className="mt-4 w-full justify-between px-0 hover:bg-transparent hover:text-foreground">
                  Support this mission <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Projects ---------- */
function Projects() {
  const projects = [
    { name: "Nairobi Sanctuary School", loc: "Kenya", cat: "Education", raised: 184_320, goal: 250_000, color: "from-amber-400/20 to-amber-600/20" },
    { name: "Refugee Nutrition Program", loc: "Jordan", cat: "Emergency", raised: 98_500, goal: 140_000, color: "from-rose-400/20 to-rose-600/20" },
    { name: "Girls Digital Academy", loc: "Bangladesh", cat: "Inclusion", raised: 312_000, goal: 400_000, color: "from-emerald-400/20 to-emerald-600/20" },
    { name: "Trauma Healing Initiative", loc: "Ukraine", cat: "Health", raised: 67_400, goal: 120_000, color: "from-sky-400/20 to-sky-600/20" },
  ];
  return (
    <section id="projects" className="bg-background py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">Active Sanctums</p>
            <h2 className="font-display text-4xl font-semibold md:text-5xl">
              Projects in <span className="font-serif italic">motion.</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {["All", "Education", "Health", "Inclusion", "Emergency", "Climate"].map((t, i) => (
              <button
                key={t}
                className={`rounded-full border px-3 py-1.5 transition-colors ${
                  i === 0
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p) => {
            const pct = Math.round((p.raised / p.goal) * 100);
            return (
              <div
                key={p.name}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:border-foreground/20 hover:shadow-card"
              >
                <div
                  className={`pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gradient-to-br ${p.color} blur-3xl`}
                />
                <div className="relative">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">{p.cat}</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {p.loc}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-semibold">{p.name}</h3>

                  <div className="mt-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="font-display text-2xl font-semibold">
                          ${p.raised.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">raised of ${p.goal.toLocaleString()}</div>
                      </div>
                      <div className="text-sm font-medium text-hope">{pct}%</div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gold-gradient transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-7 w-7 rounded-full border-2 border-card bg-sacred" />
                      ))}
                      <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium">
                        +24
                      </div>
                    </div>
                    <Link to="/projects">
                      <Button size="sm" variant="outline" className="border-foreground/20 hover:bg-foreground hover:text-background">
                        Support <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Transparency ---------- */
function Transparency() {
  return (
    <section id="transparency" className="relative overflow-hidden bg-sacred grain py-28 text-ivory">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.82_0.15_85/0.18),transparent_50%)]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold">Transparency</p>
            <h2 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
              The trust <span className="font-serif italic text-gradient-gold">engine.</span>
            </h2>
            <p className="mt-6 max-w-md text-ivory/70">
              Every dollar tracked from intent to impact. Verified by field teams, audited quarterly, and one day —
              anchored on-chain with satellite verification.
            </p>
            <div className="mt-8 space-y-3 text-sm text-ivory/80">
              {[
                "97¢ of every dollar reaches the field",
                "Quarterly third-party audits",
                "Real-time milestone verification",
                "Open ledger of allocated funds",
              ].map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-gold" /> {t}
                </div>
              ))}
            </div>
            <Link to="/transparency">
              <Button className="mt-10 bg-ivory text-midnight-deep hover:bg-ivory/90">
                Open transparency portal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <DashCard label="Total raised (2026 YTD)" value={<><span className="text-gold">$</span><AnimatedCounter to={18_420_900} /></>} delta="+24% vs '25" big />
              <DashCard label="Funds deployed" value={<AnimatedCounter to={97} suffix="%" />} delta="Allocation efficiency" />
              <DashCard label="Active projects" value={<AnimatedCounter to={47} />} delta="Across 27 countries" />
              <DashCard label="Verified milestones" value={<AnimatedCounter to={1284} />} delta="Last 90 days" />
              <div className="sm:col-span-2 rounded-2xl border border-ivory/10 bg-midnight-deep/40 p-6 backdrop-blur">
                <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-widest text-ivory/50">
                  <span>Allocation by mission</span>
                  <span>Live</span>
                </div>
                {[
                  { l: "Education", v: 38, c: "bg-gold" },
                  { l: "Nutrition", v: 24, c: "bg-hope" },
                  { l: "Health & Healing", v: 21, c: "bg-ivory" },
                  { l: "Emergency Relief", v: 12, c: "bg-alert" },
                  { l: "Operations", v: 5, c: "bg-ivory/40" },
                ].map((row) => (
                  <div key={row.l} className="mb-3 last:mb-0">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-ivory/80">{row.l}</span>
                      <span className="text-ivory/60">{row.v}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ivory/10">
                      <div className={`h-full ${row.c}`} style={{ width: `${row.v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashCard({ label, value, delta, big = false }: { label: string; value: React.ReactNode; delta: string; big?: boolean }) {
  return (
    <div className={`rounded-2xl border border-ivory/10 bg-midnight-deep/40 p-6 backdrop-blur ${big ? "sm:row-span-1" : ""}`}>
      <div className="text-xs uppercase tracking-widest text-ivory/50">{label}</div>
      <div className="mt-3 font-display text-3xl font-semibold md:text-4xl">{value}</div>
      <div className="mt-1 text-xs text-ivory/50">{delta}</div>
    </div>
  );
}

/* ---------- Testimonials ---------- */
function Testimonials() {
  const items = [
    { q: "Atlas Sanctum doesn't just take your donation — they hand you a window into where it landed.", a: "Priya R.", r: "Monthly Guardian" },
    { q: "We partnered for one school. They built an ecosystem. The transparency is unlike anything we've seen.", a: "UNDP Partner", r: "NGO Collaborator" },
    { q: "I sponsored a child two years ago. I still get her drawings. She's reading novels now.", a: "Daniel K.", r: "Sponsor" },
  ];
  return (
    <section className="bg-background py-28">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-3 text-center text-xs uppercase tracking-[0.24em] text-muted-foreground">Voices of the Guardian Wall</p>
        <h2 className="mb-16 text-center font-display text-4xl font-semibold md:text-5xl">
          Why people <span className="font-serif italic">stay.</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <figure key={i} className="rounded-2xl border border-border bg-card p-8 shadow-card">
              <blockquote className="font-serif text-xl italic leading-relaxed text-foreground/90">
                "{t.q}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-sacred" />
                <div>
                  <div className="text-sm font-medium">{t.a}</div>
                  <div className="text-xs text-muted-foreground">{t.r}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
function CallToAction() {
  return (
    <section className="bg-background pb-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-dawn grain p-12 text-ivory md:p-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,oklch(0.82_0.15_85/0.4),transparent_60%)]" />
          <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold">Become a Guardian</p>
              <h2 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
                Participate in the restoration of <span className="font-serif italic">humanity.</span>
              </h2>
              <p className="mt-5 max-w-md text-ivory/80">
                Your monthly contribution could fund 240 learning hours, 1,200 meals, or a year of trauma care for a child.
              </p>
            </div>
            <div className="rounded-2xl border border-ivory/15 bg-midnight-deep/50 p-6 backdrop-blur">
              <div className="text-xs uppercase tracking-widest text-ivory/60">Choose your gift</div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {["$5", "$25", "$100", "Other"].map((a, i) => (
                  <button
                    key={a}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                      i === 1
                        ? "border-gold bg-gold text-midnight-deep"
                        : "border-ivory/20 text-ivory hover:border-gold hover:text-gold"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <Link to="/donate" search={{ monthly: 1 } as never}>
                <Button className="mt-4 w-full bg-gold-gradient text-midnight-deep shadow-glow hover:opacity-95" size="lg">
                  <Heart className="mr-2 h-4 w-4" /> Give monthly
                </Button>
              </Link>
              <p className="mt-3 text-center text-[11px] text-ivory/50">
                Secure checkout. Cancel anytime. Tax-deductible where applicable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

