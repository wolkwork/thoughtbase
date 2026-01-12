import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { hasPermission } from "~/lib/api/permissions";
import { db } from "~/lib/db";
import { organization } from "~/lib/db/schema";
import { Permission } from "~/plans";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

export const Route = createFileRoute("/api/widget/organization")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin") || "*";
        return new Response(null, {
          status: 204,
          headers: {
            ...corsHeaders,
            "Access-Control-Allow-Origin": origin,
          },
        });
      },
      GET: async ({ request }) => {
        const origin = request.headers.get("origin") || "*";
        const url = new URL(request.url);
        const organizationSlug = url.searchParams.get("organizationSlug");

        if (!organizationSlug) {
          return new Response("Missing organizationSlug", {
            status: 400,
            headers: {
              ...corsHeaders,
              "Access-Control-Allow-Origin": origin,
            },
          });
        }

        try {
          const org = await db.query.organization.findFirst({
            where: eq(organization.slug, organizationSlug),
          });

          if (!org) {
            return new Response("Organization not found", {
              status: 404,
              headers: {
                ...corsHeaders,
                "Access-Control-Allow-Origin": origin,
              },
            });
          }

          // Check if organization has WHITE_LABEL permission
          // If they do, they can hide branding (return false)
          // If they don't, they must show branding (return true)
          const hasWhiteLabel = await hasPermission(org.id, Permission.WHITE_LABEL);

          return new Response(
            JSON.stringify({
              showThoughtbaseBranding: !hasWhiteLabel,
            }),
            {
              headers: {
                ...corsHeaders,
                "Access-Control-Allow-Origin": origin,
                "Content-Type": "application/json",
              },
            },
          );
        } catch (e) {
          console.error("Widget Organization API Error:", e);
          return new Response(JSON.stringify({ error: (e as Error).message }), {
            status: 500,
            headers: {
              ...corsHeaders,
              "Access-Control-Allow-Origin": origin,
              "Content-Type": "application/json",
            },
          });
        }
      },
    },
  },
});
