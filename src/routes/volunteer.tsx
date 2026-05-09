import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { HandHeart, ShieldCheck, Users } from "lucide-react";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/volunteer")({
  head: () => ({
    meta: [
      { title: "Volunteer — Atlas Sanctum" },
      { name: "description", content: "Lend your skills, time, and presence. Join 500+ Atlas Sanctum volunteers across 27 countries." },
      { property: "og:title", content: "Become a Volunteer — Atlas Sanctum" },
      { property: "og:description", content: "Six months in the field rewires what you thought a classroom — or a kitchen, or a clinic — could be." },
    ],
  }),
  component: VolunteerPage,
});

const SKILLS = [
  "Teaching", "Medical", "Counseling", "Engineering", "Logistics",
  "Translation", "Design", "Photography", "Construction", "Cooking",
  "Software", "Fundraising", "Legal", "Mentorship",
];
const REGIONS = ["East Africa", "South Asia", "Middle East", "Caribbean", "Southeast Asia", "Latin America", "Europe", "Remote"];

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional(),
  skills: z.array(z.string()).min(1, "Choose at least one skill"),
  availability: z.enum(["weekends", "evenings", "full_time", "flexible"]),
  hours_per_week: z.number().min(1).max(80).optional(),
  regions: z.array(z.string()).min(1, "Choose at least one region"),
  remote_ok: z.boolean(),
  motivation: z.string().trim().max(1000).optional(),
});

function VolunteerPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<"weekends" | "evenings" | "full_time" | "flexible">("flexible");
  const [hours, setHours] = useState<number>(5);
  const [regions, setRegions] = useState<string[]>([]);
  const [remoteOk, setRemoteOk] = useState(true);
  const [motivation, setMotivation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name);
      });
    supabase
      .from("volunteer_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExisting(data);
          setFullName(data.full_name);
          setEmail(data.email);
          setPhone(data.phone ?? "");
          setSkills(data.skills ?? []);
          setAvailability(data.availability);
          setHours(data.hours_per_week ?? 5);
          setRegions(data.regions ?? []);
          setRemoteOk(data.remote_ok);
          setMotivation(data.motivation ?? "");
        }
      });
  }, [user]);

  const toggle = (list: string[], setter: (v: string[]) => void, item: string) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    const parsed = schema.safeParse({
      full_name: fullName,
      email,
      phone,
      skills,
      availability,
      hours_per_week: hours,
      regions,
      remote_ok: remoteOk,
      motivation,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const payload = { ...parsed.data, user_id: user.id };
    const { error } = existing
      ? await supabase.from("volunteer_applications").update(payload).eq("id", existing.id)
      : await supabase.from("volunteer_applications").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(existing ? "Application updated." : "Application submitted. Thank you, Guardian.");
    navigate({ to: "/account" });
  };

  if (authLoading) {
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
        <section className="relative overflow-hidden bg-sacred grain py-24 text-ivory">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,oklch(0.82_0.15_85/0.18),transparent_60%)]" />
          <div className="relative mx-auto max-w-4xl px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-midnight-deep/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
              <HandHeart className="h-3 w-3" /> Volunteer
            </div>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight md:text-6xl">
              Lend your <span className="font-serif italic text-gradient-gold">presence.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-ivory/75">
              Atlas Sanctum is built by 500+ guardians across 27 countries — teachers, medics, engineers, translators, mentors. Tell us what you bring.
            </p>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-ivory/70">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /> 500+ active volunteers</span>
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> Background-checked placements</span>
            </div>
          </div>
        </section>

        <section className="bg-background py-16">
          <div className="mx-auto max-w-3xl px-6">
            {!isAuthenticated ? (
              <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-card">
                <h2 className="font-display text-2xl font-semibold">Sign in to apply</h2>
                <p className="mt-3 text-muted-foreground">
                  Volunteer applications are tied to your Guardian account so we can match placements safely.
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <Link to="/login"><Button>Sign in</Button></Link>
                  <Link to="/signup"><Button variant="outline">Create account</Button></Link>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-8 rounded-3xl border border-border bg-card p-8 shadow-card">
                {existing && (
                  <div className="rounded-xl border border-hope/30 bg-hope/5 px-4 py-3 text-sm text-hope">
                    You already have an application. Editing will update it.
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="vemail">Email</Label>
                    <Input id="vemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Skills you bring</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SKILLS.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggle(skills, setSkills, s)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          skills.includes(s)
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Availability</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["weekends", "evenings", "full_time", "flexible"] as const).map((a) => (
                        <button
                          type="button"
                          key={a}
                          onClick={() => setAvailability(a)}
                          className={`rounded-xl border px-3 py-2 text-sm capitalize transition-colors ${
                            availability === a
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                          }`}
                        >
                          {a.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="hours">Hours per week</Label>
                    <Input id="hours" type="number" min={1} max={80} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
                  </div>
                </div>

                <div>
                  <Label>Regions you'd like to serve</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {REGIONS.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => toggle(regions, setRegions, r)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          regions.includes(r)
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
                  <div>
                    <div className="font-medium">Remote work is OK</div>
                    <div className="text-xs text-muted-foreground">Many sanctums need translation, design, software, and mentorship help remotely.</div>
                  </div>
                  <Switch checked={remoteOk} onCheckedChange={setRemoteOk} />
                </label>

                <div>
                  <Label htmlFor="why">Why this work, for you?</Label>
                  <Textarea id="why" value={motivation} onChange={(e) => setMotivation(e.target.value)} maxLength={1000} placeholder="Share what draws you to this calling…" />
                </div>

                <Button type="submit" disabled={submitting} size="lg" className="w-full bg-foreground text-background hover:bg-foreground/90">
                  {submitting ? "Submitting…" : existing ? "Update application" : "Submit application"}
                </Button>
              </form>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
