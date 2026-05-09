import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Heart, ArrowRight, Check, ShieldCheck, Sparkles, BookOpen, Utensils, HandHeart, Home, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

type Search = { project?: string; monthly?: number };

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate — Atlas Sanctum" },
      { name: "description", content: "Make a gift that becomes a measurable thread in the fabric of dignity. One-time or monthly." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    project: typeof s.project === "string" ? s.project : undefined,
    monthly: s.monthly ? 1 : undefined,
  }),
  component: DonatePage,
});

const PRESETS = [25, 50, 100, 250, 500];
const ICONS: Record<string, any> = {
  education: BookOpen,
  nutrition: Utensils,
  healing: HandHeart,
  shelter: Home,
  water: Droplet,
};

type Project = { id: string; slug: string; name: string; country: string; category: string };

function DonatePage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(search.project ?? null);
  const [monthly, setMonthly] = useState<boolean>(!!search.monthly);
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("projects")
      .select("id, slug, name, country, category")
      .order("featured", { ascending: false })
      .then(({ data }) => setProjects((data as Project[]) ?? []));
  }, []);

  useEffect(() => {
    if (user?.email && !donorEmail) setDonorEmail(user.email);
  }, [user, donorEmail]);

  const finalAmount = customAmount ? Number(customAmount) : amount;
  const project = useMemo(() => projects.find((p) => p.slug === selectedProject), [projects, selectedProject]);

  const submit = async () => {
    const schema = z.object({
      amount: z.number().min(1).max(1_000_000),
      donorName: z.string().trim().max(100).optional(),
      donorEmail: z.string().trim().email().max(255),
      message: z.string().trim().max(1000).optional(),
    });
    const parsed = schema.safeParse({
      amount: finalAmount,
      donorName: anonymous ? undefined : donorName,
      donorEmail,
      message,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);

    const { data, error } = await supabase
      .from("donations")
      .insert({
        user_id: user?.id ?? null,
        project_id: project?.id ?? null,
        amount: parsed.data.amount,
        currency: "USD",
        donation_type: monthly ? "monthly" : "one_time",
        donor_name: anonymous ? null : parsed.data.donorName ?? null,
        donor_email: parsed.data.donorEmail,
        message: parsed.data.message ?? null,
        anonymous,
        status: "pending",
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (error || !data) {
      toast.error(error?.message ?? "Could not save your gift.");
      return;
    }

    toast.success("Gift recorded — payment processing will activate when Stripe is enabled.");
    navigate({ to: "/donate/success", search: { id: data.id } as never });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-16">
        <section className="relative overflow-hidden bg-sacred grain py-20 text-ivory">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,oklch(0.82_0.15_85/0.18),transparent_50%)]" />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-midnight-deep/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
              <Sparkles className="h-3 w-3" /> Your gift in motion
            </div>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight md:text-6xl">
              A thread in the <span className="font-serif italic text-gradient-gold">fabric of dignity.</span>
            </h1>
            <p className="mt-6 text-lg text-ivory/75">
              97¢ of every dollar reaches the field. Track it, follow it, share it.
            </p>
          </div>
        </section>

        <section className="bg-background py-16">
          <div className="mx-auto max-w-3xl px-6">
            <Stepper step={step} />

            <div className="mt-8 rounded-3xl border border-border bg-card p-8 shadow-card">
              {step === 1 && (
                <Step1
                  projects={projects}
                  selected={selectedProject}
                  onSelect={setSelectedProject}
                  onNext={() => setStep(2)}
                />
              )}
              {step === 2 && (
                <Step2
                  amount={amount}
                  setAmount={(a) => {
                    setAmount(a);
                    setCustomAmount("");
                  }}
                  customAmount={customAmount}
                  setCustomAmount={setCustomAmount}
                  monthly={monthly}
                  setMonthly={setMonthly}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              )}
              {step === 3 && (
                <Step3
                  finalAmount={finalAmount}
                  monthly={monthly}
                  project={project}
                  donorName={donorName}
                  setDonorName={setDonorName}
                  donorEmail={donorEmail}
                  setDonorEmail={setDonorEmail}
                  message={message}
                  setMessage={setMessage}
                  anonymous={anonymous}
                  setAnonymous={setAnonymous}
                  onBack={() => setStep(2)}
                  onSubmit={submit}
                  submitting={submitting}
                />
              )}
            </div>

            <ImpactPreview amount={finalAmount} category={project?.category ?? "education"} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ["Mission", "Amount", "Details"];
  return (
    <div className="flex items-center justify-between gap-3">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={s} className="flex flex-1 items-center gap-3">
            <div
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                done ? "bg-hope text-background" : active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : n}
            </div>
            <span className={`text-sm ${active ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <div className="ml-2 hidden h-px flex-1 bg-border md:block" />}
          </div>
        );
      })}
    </div>
  );
}

function Step1({
  projects,
  selected,
  onSelect,
  onNext,
}: {
  projects: Project[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Choose a sanctum</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick a specific project or give to where the need is greatest.
      </p>
      <div className="mt-6 space-y-2">
        <label className={card(selected === null)}>
          <input type="radio" name="proj" checked={selected === null} onChange={() => onSelect(null)} className="sr-only" />
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-sacred text-gold">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Where it's needed most</div>
            <div className="text-xs text-muted-foreground">Atlas Sanctum directs your gift to the most urgent active project.</div>
          </div>
          {selected === null && <Check className="h-4 w-4 text-hope" />}
        </label>
        {projects.map((p) => {
          const Icon = ICONS[p.category] ?? Sparkles;
          return (
            <label key={p.id} className={card(selected === p.slug)}>
              <input type="radio" name="proj" checked={selected === p.slug} onChange={() => onSelect(p.slug)} className="sr-only" />
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{p.country} · {p.category}</div>
              </div>
              {selected === p.slug && <Check className="h-4 w-4 text-hope" />}
            </label>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} className="bg-foreground text-background hover:bg-foreground/90">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function card(active: boolean) {
  return `flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
    active ? "border-foreground bg-secondary" : "border-border hover:border-foreground/30"
  }`;
}

function Step2({
  amount, setAmount, customAmount, setCustomAmount, monthly, setMonthly, onBack, onNext,
}: {
  amount: number; setAmount: (n: number) => void;
  customAmount: string; setCustomAmount: (s: string) => void;
  monthly: boolean; setMonthly: (b: boolean) => void;
  onBack: () => void; onNext: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">How much shall we send?</h2>
      <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
        <div>
          <div className="font-medium">{monthly ? "Monthly gift" : "One-time gift"}</div>
          <div className="text-xs text-muted-foreground">
            {monthly ? "Sustained impact, every month — cancel anytime." : "A single gift, with full transparency reports."}
          </div>
        </div>
        <Switch checked={monthly} onCheckedChange={setMonthly} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setAmount(p);
              setCustomAmount("");
            }}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              !customAmount && amount === p
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/30"
            }`}
          >
            ${p}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Label htmlFor="custom" className="text-xs uppercase tracking-widest text-muted-foreground">Or enter a custom amount</Label>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-2xl font-semibold">$</span>
          <Input
            id="custom"
            type="number"
            min={1}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder={String(amount)}
            className="text-2xl font-semibold"
          />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} className="bg-foreground text-background hover:bg-foreground/90">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Step3({
  finalAmount, monthly, project, donorName, setDonorName, donorEmail, setDonorEmail, message, setMessage,
  anonymous, setAnonymous, onBack, onSubmit, submitting,
}: any) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Almost there.</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Giving <span className="font-medium text-foreground">${finalAmount}</span>{" "}
        {monthly ? "per month" : "once"}{project ? ` to ${project.name}` : " where it's needed most"}.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email (for your receipt)</Label>
          <Input id="email" type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="name">Your name {anonymous && <span className="text-muted-foreground">(hidden)</span>}</Label>
          <Input id="name" value={donorName} onChange={(e) => setDonorName(e.target.value)} disabled={anonymous} />
        </div>
        <div>
          <Label htmlFor="msg">A note (optional)</Label>
          <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="A blessing for the children of this sanctum…" />
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
          <div>
            <div className="font-medium">Make this gift anonymous</div>
            <div className="text-xs text-muted-foreground">Your name won't appear publicly.</div>
          </div>
          <Switch checked={anonymous} onCheckedChange={setAnonymous} />
        </label>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mb-1 h-4 w-4 text-gold" />
        Stripe payment will be activated by your administrator. Your gift is recorded and you'll receive a confirmation email when payment is enabled.
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button
          size="lg"
          disabled={submitting}
          onClick={onSubmit}
          className="bg-gold-gradient text-midnight-deep shadow-glow hover:opacity-95"
        >
          <Heart className="mr-2 h-4 w-4" />
          {submitting ? "Recording…" : `Give $${finalAmount}${monthly ? "/mo" : ""}`}
        </Button>
      </div>
    </div>
  );
}

function ImpactPreview({ amount, category }: { amount: number; category: string }) {
  const lines: Record<string, (n: number) => string> = {
    education: (n) => `≈ ${Math.max(1, Math.round(n / 12))} school days for one child`,
    nutrition: (n) => `≈ ${Math.max(1, Math.round(n / 0.4))} fortified meals delivered`,
    healing: (n) => `≈ ${Math.max(1, Math.round(n / 35))} therapy sessions for displaced children`,
    shelter: (n) => `≈ ${Math.max(1, Math.round(n / 700))} emergency shelter kits`,
    water: (n) => `≈ ${Math.max(1, Math.round(n / 0.45))} liters of clean water filtered`,
  };
  const fn = lines[category] ?? lines.education;
  return (
    <div className="mt-6 rounded-2xl border border-hope/30 bg-hope/5 p-6 text-sm">
      <div className="text-xs uppercase tracking-widest text-hope">What your ${amount} can do</div>
      <div className="mt-2 font-display text-xl font-semibold">{fn(amount)}</div>
    </div>
  );
}
