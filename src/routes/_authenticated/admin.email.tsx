import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, ShieldCheck, Send, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/email")({
  head: () => ({ meta: [{ title: "Email — Atlas Sanctum Admin" }] }),
  component: AdminEmailPage,
});

type LogRow = {
  id: string;
  template_name: string | null;
  recipient_email: string | null;
  status: string | null;
  error_message: string | null;
  created_at: string;
};

function AdminEmailPage() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [testTo, setTestTo] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsAvailable, setLogsAvailable] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate({ to: "/account" });
      return;
    }
    if (user?.email && !testTo) setTestTo(user.email);
    loadLogs();
  }, [isAdmin, loading, navigate, user]);

  async function loadLogs() {
    // donation_email_log records every receipt attempt (webhook + test).
    const { data, error } = await supabase
      .from("donation_email_log")
      .select("id, template_name, recipient_email, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      setLogsAvailable(false);
      return;
    }
    setLogsAvailable(true);
    setLogs((data as LogRow[]) ?? []);
  }

  async function sendTest() {
    if (!testTo) {
      toast.error("Enter a recipient");
      return;
    }
    setSending(true);
    setLastResult(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch("/lovable/email/transactional/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          templateName: "donation-confirmation",
          recipientEmail: testTo,
          idempotencyKey: `email-test-${Date.now()}`,
          templateData: { name: "Atlas tester" },
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        setLastResult({ ok: false, message: `${res.status} — ${text.slice(0, 240)}` });
      } else {
        setLastResult({ ok: true, message: text || "Queued successfully." });
        toast.success("Test enqueued");
      }
      loadLogs();
    } catch (err: any) {
      setLastResult({ ok: false, message: err.message ?? "Request failed" });
    } finally {
      setSending(false);
    }
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="pt-32 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const infraReady = logsAvailable;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-16">
        <section className="border-b border-border bg-sacred grain text-ivory">
          <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-6 py-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-midnight-deep/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
                <Mail className="h-3 w-3" /> Email
              </div>
              <h1 className="mt-4 font-display text-3xl font-semibold md:text-4xl">Donor mail.</h1>
              <p className="mt-2 text-sm text-ivory/70">Domain status, sender address, and a live test send.</p>
            </div>
            <Link to="/admin">
              <Button variant="outline" className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10">← Admin console</Button>
            </Link>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
              <h2 className="font-display text-xl font-semibold">Configuration</h2>
              <dl className="mt-4 divide-y divide-border text-sm">
                <Row label="Infrastructure">
                  {infraReady ? (
                    <span className="inline-flex items-center gap-1.5 text-hope">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Provisioned
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-500">
                      <Clock className="h-3.5 w-3.5" /> Awaiting setup
                    </span>
                  )}
                </Row>
                <Row label="Sender domain">
                  <span className="font-mono text-xs">{infraReady ? "notify.<your-domain>" : "Not configured"}</span>
                </Row>
                <Row label="From address">
                  <span className="font-mono text-xs">noreply@&lt;your-domain&gt;</span>
                </Row>
                <Row label="Webhook (Stripe)"><span className="font-mono text-xs">/api/public/webhooks/stripe</span></Row>
              </dl>
              {!infraReady && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                  <p>
                    Email infrastructure isn't set up yet. Configure your sender domain so the Stripe webhook can deliver
                    donor confirmation receipts. Use the button at the end of this page to begin setup.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Live test</h2>
              <p className="text-sm text-muted-foreground">Send a test donation receipt to verify deliverability.</p>
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label>Recipient</Label>
                  <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" />
                </div>
                <Button onClick={sendTest} disabled={sending || !infraReady} className="w-full bg-gold-gradient text-midnight-deep">
                  <Send className="mr-2 h-3.5 w-3.5" />
                  {sending ? "Sending…" : "Send test email"}
                </Button>
                {lastResult && (
                  <div
                    className={`rounded-md border p-3 text-xs ${
                      lastResult.ok ? "border-hope/30 bg-hope/10 text-hope" : "border-alert/30 bg-alert/10 text-alert"
                    }`}
                  >
                    {lastResult.ok ? "✓ " : "✗ "}
                    {lastResult.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {infraReady && (
          <section className="bg-background pb-16">
            <div className="mx-auto max-w-7xl px-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-xl font-semibold">Recent sends</h2>
                {logs.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">No emails sent yet.</p>
                ) : (
                  <table className="mt-4 w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                        <th className="pb-2">When</th>
                        <th className="pb-2">Template</th>
                        <th className="pb-2">Recipient</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((l) => (
                        <tr key={l.id} className="border-t border-border">
                          <td className="py-2 text-xs">{new Date(l.created_at).toLocaleString()}</td>
                          <td className="py-2 text-xs">{l.template_name}</td>
                          <td className="py-2 text-xs">{l.recipient_email}</td>
                          <td className="py-2 text-xs">
                            <span className={`rounded-full px-2 py-0.5 ${l.status === "sent" ? "bg-hope/15 text-hope" : l.status === "pending" ? "bg-secondary" : "bg-alert/15 text-alert"}`}>
                              {l.status}
                            </span>
                            {l.error_message && <span className="ml-2 text-alert">{l.error_message}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
