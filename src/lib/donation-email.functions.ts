import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Sends a donation confirmation email to the donor.
 *
 * Enqueues via Lovable's transactional email queue at
 * /lovable/email/queue/enqueue. If email infrastructure is not yet set up
 * (no domain configured), this returns { skipped: true } so the webhook
 * can keep processing without failing.
 */
export const sendDonationReceipt = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ donationId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { data: donation } = await supabaseAdmin
      .from("donations")
      .select(
        "id, amount, currency, donation_type, donor_name, donor_email, message, anonymous, receipt_url, project_id, confirmed_at",
      )
      .eq("id", data.donationId)
      .maybeSingle();

    if (!donation || !donation.donor_email) {
      return { skipped: true, reason: "no donation or recipient" };
    }

    let projectName: string | null = null;
    if (donation.project_id) {
      const { data: p } = await supabaseAdmin
        .from("projects")
        .select("name")
        .eq("id", donation.project_id)
        .maybeSingle();
      projectName = (p as any)?.name ?? null;
    }

    const amount = `$${Number(donation.amount).toLocaleString()}`;
    const cadence = donation.donation_type === "monthly" ? " / month" : "";
    const supporting = projectName ? ` to ${projectName}` : " where it is needed most";
    const greeting = donation.anonymous ? "Guardian" : donation.donor_name || "Guardian";

    const subject = `Your gift of ${amount}${cadence} is confirmed — Atlas Sanctum`;

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 32px;">
        <div style="text-align:center; padding: 24px 0; border-bottom: 1px solid #eee;">
          <div style="font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; color: #b8860b;">Atlas Sanctum</div>
          <h1 style="font-size: 28px; margin: 12px 0 0; font-weight: 600;">Thank you, ${escapeHtml(greeting)}.</h1>
        </div>
        <p style="margin-top: 24px; font-size: 16px; line-height: 1.6;">
          Your gift of <strong>${amount}${cadence}</strong>${escapeHtml(supporting)} has been confirmed.
        </p>
        ${donation.message ? `<blockquote style="margin: 24px 0; padding: 16px 20px; border-left: 3px solid #b8860b; font-style: italic; color: #444;">"${escapeHtml(donation.message)}"</blockquote>` : ""}
        <p style="margin-top: 24px; font-size: 14px; line-height: 1.6; color: #555;">
          A full receipt is attached below for your records.
        </p>
        ${
          donation.receipt_url
            ? `<p style="margin-top: 16px;"><a href="${donation.receipt_url}" style="display: inline-block; background: #b8860b; color: #1a1a1a; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Download receipt</a></p>`
            : ""
        }
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888; line-height: 1.6;">
          You'll find this gift on your Guardian dashboard, alongside the field updates from the sanctum it supports.
          <br/><br/>
          Atlas Sanctum — a humanitarian command center for compassion.
        </p>
      </div>
    `;

    const text = `Thank you, ${greeting}.

Your gift of ${amount}${cadence}${supporting} has been confirmed.
${donation.message ? `\n"${donation.message}"\n` : ""}
${donation.receipt_url ? `Receipt: ${donation.receipt_url}\n` : ""}
Atlas Sanctum`;

    // Enqueue through Lovable Emails queue. If infra is not yet provisioned,
    // we return skipped so the webhook stays green.
    try {
      const url = `${process.env.SUPABASE_URL}/rest/v1/rpc/enqueue_email`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({
          queue: "transactional_emails",
          message: {
            template_name: "donation-confirmation",
            message_id: `donation-${donation.id}-${donation.confirmed_at ?? Date.now()}`,
            to: donation.donor_email,
            subject,
            html,
            text,
            metadata: { donation_id: donation.id, project_id: donation.project_id },
          },
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { skipped: true, reason: `enqueue failed: ${res.status} ${body.slice(0, 140)}` };
      }
      return { sent: true };
    } catch (err) {
      return { skipped: true, reason: (err as Error).message };
    }
  });

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
