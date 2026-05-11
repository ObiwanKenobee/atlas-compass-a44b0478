import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Public proof endpoint.
 *
 * Resolves a monthly_reports.share_token to a fresh, time-limited signed URL
 * for the underlying storage object, then redirects.
 *
 * Rejects when:
 *  - the token does not exist
 *  - the report is not published or not verified
 *  - the share_expires_at deadline has passed
 *  - no attachment is attached to the report
 */
export const Route = createFileRoute("/api/public/reports/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = params.token;
        if (!token) return new Response("Missing token", { status: 400 });

        const { data: report } = await supabaseAdmin
          .from("monthly_reports")
          .select(
            "id, headline, published, verified, attachment_path, share_expires_at",
          )
          .eq("share_token", token as never)
          .maybeSingle();

        if (!report) return new Response("Report not found", { status: 404 });
        if (!report.published || !report.verified) {
          return new Response("Report not yet published", { status: 403 });
        }
        const expiresAt = (report as { share_expires_at?: string | null }).share_expires_at;
        if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
          return new Response("This proof link has expired.", { status: 410 });
        }
        const path = (report as { attachment_path?: string | null }).attachment_path;
        if (!path) return new Response("No attachment", { status: 404 });

        // Mint a short-lived signed URL each time the share link is used —
        // the proof token never exposes the raw storage path.
        const ttlSeconds = 60 * 15;
        const { data: signed, error } = await supabaseAdmin.storage
          .from("report-attachments")
          .createSignedUrl(path, ttlSeconds);

        if (error || !signed) {
          return new Response("Unable to mint signed URL", { status: 500 });
        }
        return new Response(null, {
          status: 302,
          headers: { Location: signed.signedUrl, "Cache-Control": "no-store" },
        });
      },
    },
  },
});
