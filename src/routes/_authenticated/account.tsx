import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, HandHeart, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [{ title: "My Account — Atlas Sanctum" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [application, setApplication] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase
      .from("donations")
      .select("id, amount, currency, donation_type, status, created_at, project_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setDonations(data ?? []));
    supabase
      .from("volunteer_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setApplication(data));
  }, [user]);

  const totalGiven = donations
    .filter((d) => d.status === "succeeded")
    .reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-16">
        <section className="border-b border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Guardian dashboard</p>
            <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
              Welcome, <span className="font-serif italic">{profile?.full_name || user?.email}.</span>
            </h1>
          </div>
        </section>

        <section className="bg-background py-12">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3">
            <Stat icon={Heart} label="Total given" value={`$${totalGiven.toLocaleString()}`} />
            <Stat icon={UserIcon} label="Gifts recorded" value={String(donations.length)} />
            <Stat icon={HandHeart} label="Volunteer status" value={application ? application.status : "Not applied"} />
          </div>
        </section>

        <section className="bg-background pb-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-xl font-semibold">My gifts</h2>
                {donations.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    No gifts yet. <Link to="/donate" className="font-medium text-foreground underline-offset-4 hover:underline">Make your first.</Link>
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-border">
                    {donations.map((d) => (
                      <li key={d.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <div className="font-medium">${Number(d.amount).toLocaleString()} {d.currency} {d.donation_type === "monthly" && <span className="text-muted-foreground">· monthly</span>}</div>
                          <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs ${
                            d.status === "succeeded" ? "bg-hope/15 text-hope" :
                            d.status === "pending" ? "bg-secondary text-foreground" :
                            "bg-alert/15 text-alert"
                          }`}
                        >
                          {d.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <aside>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-xl font-semibold">Volunteer</h2>
                {application ? (
                  <>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Submitted {new Date(application.created_at).toLocaleDateString()}.
                      Status: <span className="font-medium text-foreground capitalize">{application.status}</span>.
                    </p>
                    <Link to="/volunteer">
                      <Button variant="outline" className="mt-4 w-full">Edit application</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Lend your skills to a sanctum.
                    </p>
                    <Link to="/volunteer">
                      <Button className="mt-4 w-full">Apply to volunteer</Button>
                    </Link>
                  </>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <Icon className="h-4 w-4 text-gold" />
      <div className="mt-3 font-display text-2xl font-semibold capitalize">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
