import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FileText,
  Upload,
  ShieldCheck,
  Copy,
  ExternalLink,
  CheckCircle2,
  EyeOff,
  Eye,
  History,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/atlas/SiteHeader";
import { SiteFooter } from "@/components/atlas/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Monthly reports — Atlas Sanctum Admin" }] }),
  component: AdminReportsPage,
});

type Report = {
  id: string;
  month: string;
  headline: string;
  narrative: string | null;
  total_raised: number;
  total_distributed: number;
  beneficiaries_reached: number;
  attachment_url: string | null;
  attachment_path: string | null;
  share_url: string | null;
  share_token: string | null;
  share_expires_at: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  verified_by_user: string | null;
  published: boolean;
  uploaded_by: string | null;
  uploaded_at: string | null;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
};

const SHARE_LINK_TTL_OPTIONS = [
  { label: "24 hours", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
  { label: "Never expires", days: 0 },
];

function AdminReportsPage() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [ttlDaysById, setTtlDaysById] = useState<Record<string, number>>({});

  // new-report form
  const [month, setMonth] = useState("");
  const [headline, setHeadline] = useState("");
  const [narrative, setNarrative] = useState("");
  const [totalRaised, setTotalRaised] = useState("");
  const [totalDistributed, setTotalDistributed] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate({ to: "/account" });
      return;
    }
    refresh();
  }, [isAdmin, loading, navigate]);

  async function refresh() {
    const { data } = await supabase
      .from("monthly_reports")
      .select("*")
      .order("month", { ascending: false });
    const list = (data as Report[]) ?? [];
    setReports(list);

    const ids = Array.from(
      new Set(
        list
          .flatMap((r) => [r.uploaded_by, r.published_by, r.verified_by_user])
          .filter((v): v is string => !!v),
      ),
    );
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      const m: Record<string, string> = {};
      (profs ?? []).forEach((p: { id: string; full_name: string | null }) => {
        m[p.id] = p.full_name ?? p.id.slice(0, 8);
      });
      setProfilesById(m);
    }
  }

  async function uploadAttachment(reportId: string, f: File) {
    const path = `${reportId}/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage
      .from("report-attachments")
      .upload(path, f, { upsert: true, contentType: f.type || undefined });
    if (upErr) throw upErr;
    return path;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!month || !headline) {
      toast.error("Month and headline are required");
      return;
    }
    setCreating(true);
    try {
      const { data: inserted, error } = await supabase
        .from("monthly_reports")
        .insert({
          month,
          headline,
          narrative: narrative || null,
          total_raised: Number(totalRaised) || 0,
          total_distributed: Number(totalDistributed) || 0,
          beneficiaries_reached: Number(beneficiaries) || 0,
          verified_by: verifiedBy || null,
          published: false,
          verified: false,
        })
        .select()
        .single();
      if (error) throw error;
      if (file && inserted) {
        const path = await uploadAttachment(inserted.id, file);
        await supabase
          .from("monthly_reports")
          .update({
            attachment_path: path,
            uploaded_by: user?.id ?? null,
            uploaded_at: new Date().toISOString(),
          })
          .eq("id", inserted.id);
      }
      toast.success("Report created");
      setMonth(""); setHeadline(""); setNarrative(""); setTotalRaised("");
      setTotalDistributed(""); setBeneficiaries(""); setVerifiedBy(""); setFile(null);
      refresh();
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to create report");
    } finally {
      setCreating(false);
    }
  }

  async function handleReplaceFile(report: Report, f: File) {
    setBusy(report.id);
    try {
      const path = await uploadAttachment(report.id, f);
      const { error } = await supabase
        .from("monthly_reports")
        .update({
          attachment_path: path,
          uploaded_by: user?.id ?? null,
          uploaded_at: new Date().toISOString(),
        })
        .eq("id", report.id);
      if (error) throw error;
      toast.success("Attachment uploaded");
      refresh();
    } catch (err) {
      toast.error((err as Error).message ?? "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  function newToken() {
    return crypto.randomUUID().replace(/-/g, "");
  }

  async function publishAndVerify(report: Report) {
    if (!report.attachment_path) {
      toast.error("Upload an attachment before verifying");
      return;
    }
    setBusy(report.id);
    const ttlDays = ttlDaysById[report.id] ?? 90;
    const now = new Date();
    const token = report.share_token ?? newToken();
    const expiresAt =
      ttlDays === 0 ? null : new Date(now.getTime() + ttlDays * 86400 * 1000).toISOString();

    const { error } = await supabase
      .from("monthly_reports")
      .update({
        published: true,
        verified: true,
        published_by: user?.id ?? null,
        published_at: now.toISOString(),
        verified_at: now.toISOString(),
        verified_by_user: user?.id ?? null,
        share_token: token,
        share_expires_at: expiresAt,
      })
      .eq("id", report.id);
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Published & verified");
      refresh();
    }
  }

  async function togglePublished(report: Report) {
    setBusy(report.id);
    const { error } = await supabase
      .from("monthly_reports")
      .update({
        published: !report.published,
        published_by: !report.published ? user?.id ?? null : report.published_by,
        published_at: !report.published ? new Date().toISOString() : report.published_at,
      })
      .eq("id", report.id);
    setBusy(null);
    if (error) toast.error(error.message);
    else refresh();
  }

  async function rotateShareLink(report: Report) {
    const ttlDays = ttlDaysById[report.id] ?? 90;
    const token = newToken();
    const expiresAt =
      ttlDays === 0 ? null : new Date(Date.now() + ttlDays * 86400 * 1000).toISOString();
    const { error } = await supabase
      .from("monthly_reports")
      .update({ share_token: token, share_expires_at: expiresAt })
      .eq("id", report.id);
    if (error) toast.error(error.message);
    else {
      toast.success("New proof link issued");
      refresh();
    }
  }

  function copyShareLink(token: string) {
    const url = `${window.location.origin}/api/public/reports/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("One-click proof link copied");
  }

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
          <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-6 py-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-midnight-deep/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
                <FileText className="h-3 w-3" /> Monthly Reports
              </div>
              <h1 className="mt-4 font-display text-3xl font-semibold md:text-4xl">Proof, published.</h1>
              <p className="mt-2 text-sm text-ivory/70">
                Upload, verify, and issue expiring one-click proof links. Every action is signed and timestamped.
              </p>
            </div>
            <Link to="/admin">
              <Button variant="outline" className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10">← Admin console</Button>
            </Link>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="mx-auto max-w-7xl px-6">
            <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">New report</h2>
              <p className="text-sm text-muted-foreground">Draft a report, attach the audited PDF, then publish & verify.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Month *</Label>
                  <Input type="month" value={month ? month.slice(0, 7) : ""} onChange={(e) => setMonth(e.target.value ? `${e.target.value}-01` : "")} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Headline *</Label>
                  <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="May 2026 — 4,210 lives reached" />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label>Narrative</Label>
                  <Textarea rows={3} value={narrative} onChange={(e) => setNarrative(e.target.value)} placeholder="What happened in the field this month?" />
                </div>
                <div className="space-y-1.5">
                  <Label>Total raised (USD)</Label>
                  <Input type="number" value={totalRaised} onChange={(e) => setTotalRaised(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Total distributed (USD)</Label>
                  <Input type="number" value={totalDistributed} onChange={(e) => setTotalDistributed(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Beneficiaries reached</Label>
                  <Input type="number" value={beneficiaries} onChange={(e) => setBeneficiaries(e.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Verified by (auditor)</Label>
                  <Input value={verifiedBy} onChange={(e) => setVerifiedBy(e.target.value)} placeholder="e.g. Grant Thornton LLP" />
                </div>
                <div className="space-y-1.5">
                  <Label>Attachment (PDF)</Label>
                  <Input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button type="submit" disabled={creating} className="bg-gold-gradient text-midnight-deep">
                  {creating ? "Creating…" : "Create draft"}
                </Button>
              </div>
            </form>

            <div className="mt-8 space-y-4">
              {reports.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  No reports yet — create the first one above.
                </p>
              ) : (
                reports.map((r) => {
                  const ttlDays = ttlDaysById[r.id] ?? 90;
                  const expired = r.share_expires_at && new Date(r.share_expires_at).getTime() < Date.now();
                  return (
                    <div key={r.id} className="rounded-2xl border border-border bg-card p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-lg font-semibold">{r.headline}</h3>
                            {r.verified && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-hope/30 bg-hope/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-hope">
                                <ShieldCheck className="h-3 w-3" /> Verified
                              </span>
                            )}
                            {r.published ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                                <Eye className="h-3 w-3" /> Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                                <EyeOff className="h-3 w-3" /> Draft
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {new Date(r.month).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
                            {r.verified_by ? ` · audited by ${r.verified_by}` : ""}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept="application/pdf,image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleReplaceFile(r, f);
                              }}
                            />
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary">
                              <Upload className="h-3 w-3" />
                              {r.attachment_path ? "Replace file" : "Upload file"}
                            </span>
                          </label>
                          {!r.verified ? (
                            <>
                              <select
                                value={ttlDays}
                                onChange={(e) =>
                                  setTtlDaysById((m) => ({ ...m, [r.id]: Number(e.target.value) }))
                                }
                                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                              >
                                {SHARE_LINK_TTL_OPTIONS.map((o) => (
                                  <option key={o.days} value={o.days}>
                                    Link expires: {o.label}
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                className="h-8 bg-gold-gradient text-midnight-deep"
                                disabled={busy === r.id || !r.attachment_path}
                                onClick={() => publishAndVerify(r)}
                              >
                                <CheckCircle2 className="mr-1.5 h-3 w-3" /> Publish & verify
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" className="h-8" disabled={busy === r.id} onClick={() => togglePublished(r)}>
                              {r.published ? "Unpublish" : "Republish"}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Metric label="Raised" value={`$${Number(r.total_raised).toLocaleString()}`} />
                        <Metric label="Distributed" value={`$${Number(r.total_distributed).toLocaleString()}`} />
                        <Metric label="Beneficiaries" value={Number(r.beneficiaries_reached).toLocaleString()} />
                      </div>

                      {r.verified && r.share_token && (
                        <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                One-click proof link
                              </div>
                              <div className="mt-1 font-mono text-xs break-all">
                                /api/public/reports/{r.share_token.slice(0, 12)}…
                              </div>
                              <div className={`mt-1 inline-flex items-center gap-1 text-[11px] ${expired ? "text-alert" : "text-muted-foreground"}`}>
                                <Clock className="h-3 w-3" />
                                {r.share_expires_at
                                  ? expired
                                    ? `Expired ${new Date(r.share_expires_at).toLocaleString()}`
                                    : `Expires ${new Date(r.share_expires_at).toLocaleString()}`
                                  : "No expiration"}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={ttlDays}
                                onChange={(e) =>
                                  setTtlDaysById((m) => ({ ...m, [r.id]: Number(e.target.value) }))
                                }
                                className="rounded-md border border-border bg-card px-2 py-1 text-xs"
                              >
                                {SHARE_LINK_TTL_OPTIONS.map((o) => (
                                  <option key={o.days} value={o.days}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                              <Button size="sm" variant="outline" className="h-8" onClick={() => rotateShareLink(r)}>
                                Rotate
                              </Button>
                              <a
                                href={`/api/public/reports/${r.share_token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open proof link"
                              >
                                <Button size="sm" variant="outline" className="h-8">
                                  <ExternalLink className="mr-1.5 h-3 w-3" /> Open
                                </Button>
                              </a>
                              <Button size="sm" className="h-8 bg-foreground text-background" onClick={() => copyShareLink(r.share_token!)}>
                                <Copy className="mr-1.5 h-3 w-3" /> Copy link
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 rounded-xl border border-dashed border-border p-4">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                          <History className="h-3 w-3" /> Audit trail
                        </div>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <li>
                            <span className="text-foreground">Uploaded</span>{" "}
                            {r.uploaded_at ? `· ${new Date(r.uploaded_at).toLocaleString()}` : "· not yet"}
                            {r.uploaded_by ? ` · by ${profilesById[r.uploaded_by] ?? r.uploaded_by.slice(0, 8)}` : ""}
                          </li>
                          <li>
                            <span className="text-foreground">Published</span>{" "}
                            {r.published_at ? `· ${new Date(r.published_at).toLocaleString()}` : "· not yet"}
                            {r.published_by ? ` · by ${profilesById[r.published_by] ?? r.published_by.slice(0, 8)}` : ""}
                          </li>
                          <li>
                            <span className="text-foreground">Verified</span>{" "}
                            {r.verified_at ? `· ${new Date(r.verified_at).toLocaleString()}` : "· not yet"}
                            {r.verified_by_user ? ` · by ${profilesById[r.verified_by_user] ?? r.verified_by_user.slice(0, 8)}` : ""}
                            {r.verified_by ? ` · auditor ${r.verified_by}` : ""}
                          </li>
                        </ul>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold">{value}</div>
    </div>
  );
}
