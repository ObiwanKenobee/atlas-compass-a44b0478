import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendDonationReceipt } from "@/lib/donation-email.functions";

/**
 * Stripe webhook handler.
 *
 * Listens for:
 *  - checkout.session.completed       → mark one-time donation succeeded
 *  - invoice.paid                      → mark recurring donation succeeded
 *  - payment_intent.payment_failed     → mark failed
 *  - charge.refunded                   → mark refunded
 *
 * The signing secret must be stored as STRIPE_WEBHOOK_SECRET. Until it is set,
 * the route returns 503 — Stripe's signature verification cannot run safely.
 *
 * Configure the endpoint in Stripe → Developers → Webhooks pointing at
 * /api/public/webhooks/stripe (see /admin/stripe checklist for the URL).
 */

function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  // Stripe signs as: t=<timestamp>,v1=<sig>,v0=<sig>
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...rest] = p.split("=");
      return [k, rest.join("=")];
    }),
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const signed = `${t}.${payload}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function findDonationFromEvent(event: any): Promise<{ id: string } | null> {
  const obj = event?.data?.object ?? {};
  const sessionId: string | undefined =
    event.type === "checkout.session.completed" ? obj.id : obj.checkout_session ?? obj.client_reference_id;
  const piId: string | undefined = obj.payment_intent ?? (obj.object === "payment_intent" ? obj.id : undefined);
  const invoiceId: string | undefined = obj.invoice ?? (obj.object === "invoice" ? obj.id : undefined);
  const metaDonationId: string | undefined = obj.metadata?.donation_id ?? obj.client_reference_id;

  if (metaDonationId) {
    const { data } = await supabaseAdmin
      .from("donations")
      .select("id")
      .eq("id", metaDonationId)
      .maybeSingle();
    if (data) return data as { id: string };
  }
  if (sessionId) {
    const { data } = await supabaseAdmin
      .from("donations")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    if (data) return data as { id: string };
  }
  if (piId) {
    const { data } = await supabaseAdmin
      .from("donations")
      .select("id")
      .eq("stripe_payment_intent_id", piId)
      .maybeSingle();
    if (data) return data as { id: string };
  }
  if (invoiceId) {
    const { data } = await supabaseAdmin
      .from("donations")
      .select("id")
      .eq("stripe_invoice_id", invoiceId)
      .maybeSingle();
    if (data) return data as { id: string };
  }
  return null;
}

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) {
          return new Response(
            JSON.stringify({ error: "STRIPE_WEBHOOK_SECRET not configured" }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }

        const sig = request.headers.get("stripe-signature");
        const raw = await request.text();
        if (!verifyStripeSignature(raw, sig, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: any;
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const eventId: string = event.id;
        const eventType: string = event.type;

        // Idempotency — skip if already processed.
        const { data: existing } = await supabaseAdmin
          .from("stripe_events")
          .select("id")
          .eq("event_id", eventId)
          .maybeSingle();
        if (existing) {
          return Response.json({ received: true, duplicate: true });
        }

        const donation = await findDonationFromEvent(event);
        const obj = event?.data?.object ?? {};

        // Persist event for the admin timeline.
        await supabaseAdmin.from("stripe_events").insert({
          event_id: eventId,
          type: eventType,
          donation_id: donation?.id ?? null,
          payload: event,
        });

        if (!donation) {
          return Response.json({ received: true, matched: false });
        }

        const updates: Record<string, unknown> = {};
        let shouldEmail = false;

        switch (eventType) {
          case "checkout.session.completed": {
            updates.status = "succeeded";
            updates.stripe_session_id = obj.id ?? null;
            updates.stripe_payment_intent_id = obj.payment_intent ?? null;
            updates.receipt_url = obj.receipt_url ?? null;
            updates.confirmed_at = new Date().toISOString();
            shouldEmail = true;
            break;
          }
          case "invoice.paid": {
            updates.status = "succeeded";
            updates.stripe_invoice_id = obj.id ?? null;
            updates.stripe_payment_intent_id = obj.payment_intent ?? null;
            updates.receipt_url = obj.hosted_invoice_url ?? obj.invoice_pdf ?? null;
            updates.confirmed_at = new Date().toISOString();
            shouldEmail = true;
            break;
          }
          case "payment_intent.payment_failed": {
            updates.status = "failed";
            updates.failure_reason =
              obj.last_payment_error?.message ?? obj.failure_message ?? "Payment failed";
            break;
          }
          case "charge.refunded": {
            updates.status = "refunded";
            break;
          }
          default:
            // Recorded in stripe_events; no donation state change.
            return Response.json({ received: true, ignored: true });
        }

        const { data: updated } = await supabaseAdmin
          .from("donations")
          .update(updates)
          .eq("id", donation.id)
          .select("*")
          .maybeSingle();

        if (shouldEmail && updated) {
          // Fire-and-forget; failures are surfaced via email_send_log.
          sendDonationReceipt({ data: { donationId: donation.id } }).catch((err) => {
            console.error("[stripe-webhook] receipt email failed", err);
          });
        }

        return Response.json({ received: true, donation_id: donation.id });
      },
    },
  },
});
