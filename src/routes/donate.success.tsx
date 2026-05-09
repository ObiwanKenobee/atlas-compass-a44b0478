import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, Sparkles, Share2, Twitter, Facebook, Linkedin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Search = { id?: string };

export const Route = createFileRoute("/donate/success")({
  head: () => ({
    meta: [
      { title: "Thank you — Atlas Sanctum" },
      { name: "description", content: "Your gift has been received. A thread woven in the fabric of dignity." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  component: SuccessPage,
});

type Donation = {
  id: string;
  amount: number;
  currency: string;
  donation_type: string;
  donor_name: string | null;
  message: string | null;
  anonymous: boolean;
  project_id: string | null;
};

function SuccessPage() {
  const { id } = Route.useSearch();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("donations")
      .select("id, amount, currency, donation_type, donor_name, message, anonymous, project_id")
      .eq("id", id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        setDonation(data as Donation);
        if (data.project_id) {
          const { data: p } = await supabase.from("projects").select("name").eq("id", data.project_id).maybeSingle();
          if (p) setProjectName((p as any).name);
        }
      });
  }, [id]);

  const url = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = `I just gave to Atlas Sanctum — building sanctuaries for children facing unimaginable hardship.`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-16">
        <section className="relative overflow-hidden bg-sacred grain py-24 text-ivory">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,oklch(0.82_0.15_85/0.25),transparent_60%)]" />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-gradient text-midnight-deep shadow-glow">
              <Heart className="h-7 w-7" />
            </div>
            <h1 className="mt-8 font-display text-4xl font-semibold leading-tight md:text-6xl">
              Thank you, <span className="font-serif italic text-gradient-gold">Guardian.</span>
            </h1>
            <p className="mt-6 text-lg text-ivory/80">
              Your gift is now a thread in the fabric of dignity. We'll send a confirmation when your payment processes.
            </p>
          </div>
        </section>

        <section className="bg-background py-16">
          <div className="mx-auto max-w-3xl px-6">
            {/* Shareable card */}
            <div
              ref={cardRef}
              className="relative isolate overflow-hidden rounded-3xl bg-sacred grain p-10 text-ivory shadow-elegant"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,oklch(0.82_0.15_85/0.25),transparent_60%)]" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-md bg-midnight-deep/50">
                    <Sparkles className="h-4 w-4 text-gold" />
                  </div>
                  <span className="font-display text-base font-semibold">
                    Atlas <span className="text-gradient-gold">Sanctum</span>
                  </span>
                </div>

                <p className="mt-10 text-xs uppercase tracking-[0.24em] text-gold">A guardian rises</p>
                {donation ? (
                  <>
                    <div className="mt-3 font-display text-5xl font-semibold leading-tight md:text-6xl">
                      ${Number(donation.amount).toLocaleString()}{donation.donation_type === "monthly" && <span className="text-2xl text-ivory/70"> /month</span>}
                    </div>
                    <p className="mt-4 max-w-md font-serif text-xl italic leading-snug text-ivory/85">
                      {donation.message
                        ? `"${donation.message}"`
                        : "Every child seen. Every meal counted. Every milestone verified."}
                    </p>
                    <p className="mt-6 text-sm text-ivory/70">
                      {donation.anonymous ? "An anonymous Guardian" : (donation.donor_name || "A Guardian")}{" "}
                      {projectName ? `· supporting ${projectName}` : "· supporting where it's needed most"}
                    </p>
                  </>
                ) : (
                  <div className="mt-3 h-12 w-48 animate-pulse rounded bg-ivory/10" />
                )}

                <div className="mt-10 flex items-center justify-between text-[10px] uppercase tracking-widest text-ivory/50">
                  <span>atlassanctum.org</span>
                  <span>27 countries · 47 sanctums</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={copyLink}>
                <Share2 className="mr-2 h-4 w-4" /> Copy link
              </Button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline"><Twitter className="mr-2 h-4 w-4" /> Twitter</Button>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline"><Facebook className="mr-2 h-4 w-4" /> Facebook</Button>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline"><Linkedin className="mr-2 h-4 w-4" /> LinkedIn</Button>
              </a>
              <Button variant="outline" onClick={() => window.print()}>
                <Download className="mr-2 h-4 w-4" /> Save card
              </Button>
            </div>

            <div className="mt-12 grid gap-3 text-center sm:grid-cols-2">
              <Link to="/projects">
                <Button variant="outline" className="w-full">Explore more sanctums →</Button>
              </Link>
              <Link to="/transparency">
                <Button variant="outline" className="w-full">Open the transparency portal →</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
