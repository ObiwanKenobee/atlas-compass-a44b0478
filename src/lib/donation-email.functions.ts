import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Send the donor confirmation receipt for a confirmed donation.
 *
 * Flow:
 *  1. Load the donation + project name.
 *  2. Insert a pending row into donation_email_log so admins can audit every attempt.
 *  3. POST to /lovable/email/transactional/send with the `donation-confirmation`
 *     template. The transactional pipeline takes care of rendering, queueing,
 *     retries, and the actual SMTP handoff.
 *  4. Update the log row with the final status / error.
 *
 * If the transactional pipeline is not yet provisioned (no email domain),
 * the call returns a non-2xx and we record `infra_pending` in the log so the
 * admin email page surfaces the issue without breaking the webhook.
 */
export const sendDonationReceipt = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        donationId: z.string().uuid(),
        trigger: z.enum(["webhook", "manual_test", "resend"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const trigger = data.trigger ?? "webhook";

    const { data: donation } = await supabaseAdmin
      .from("donations")
      .select(
        "id, amount, currency, donation_type, donor_name, donor_email, message, anonymous, receipt_url, project_id",
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
      projectName = (p as { name?: string } | null)?.name ?? null;
    }

    const messageId = `donation-${donation.id}-${Date.now()}`;
    const greeting = donation.anonymous
      ? "Guardian"
      : donation.donor_name || "Guardian";

    // 1) audit log row — pending
    const { data: logRow } = await supabaseAdmin
      .from("donation_email_log" as never)
      .insert({
        donation_id: donation.id,
        recipient_email: donation.donor_email,
        template_name: "donation-confirmation",
        status: "pending",
        message_id: messageId,
        trigger,
      } as never)
      .select("id")
      .single();

    const logId = (logRow as { id?: string } | null)?.id ?? null;

    // 2) hand off to the transactional pipeline
    const baseUrl = process.env.SUPABASE_URL ?? "";
    const appOrigin = process.env.APP_ORIGIN ?? "";
    const sendUrl = appOrigin
      ? `${appOrigin}/lovable/email/transactional/send`
      : "/lovable/email/transactional/send";

    let status: "sent" | "failed" | "infra_pending" = "infra_pending";
    let errorMessage: string | null = null;

    try {
      const res = await fetch(sendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Service-role auth: the transactional route accepts admin JWTs.
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
        },
        body: JSON.stringify({
          templateName: "donation-confirmation",
          recipientEmail: donation.donor_email,
          idempotencyKey: messageId,
          templateData: {
            name: greeting,
            amount: Number(donation.amount),
            cadence: donation.donation_type === "monthly" ? "monthly" : "one_time",
            projectName,
            receiptUrl: donation.receipt_url,
            donorMessage: donation.message,
          },
        }),
      });
      if (res.ok) {
        status = "sent";
      } else {
        const body = await res.text();
        // 404 / connection refused means email infra hasn't been scaffolded yet.
        if (res.status === 404 || res.status === 503) {
          status = "infra_pending";
          errorMessage = `Email infrastructure not provisioned (${res.status}).`;
        } else {
          status = "failed";
          errorMessage = `${res.status} ${body.slice(0, 240)}`;
        }
      }
    } catch (err) {
      status = "infra_pending";
      errorMessage = `Send endpoint unreachable: ${(err as Error).message}`;
    }

    // 3) close out the audit row
    if (logId) {
      await supabaseAdmin
        .from("donation_email_log" as never)
        .update({ status, error_message: errorMessage } as never)
        .eq("id", logId);
    }

    return { status, errorMessage, logId, messageId, baseUrl };
  });
