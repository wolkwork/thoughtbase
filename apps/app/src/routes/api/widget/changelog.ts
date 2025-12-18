import { createFileRoute } from "@tanstack/react-router";
import { $getPublishedChangelogs } from "~/lib/api/changelogs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

export const Route = createFileRoute("/api/widget/changelog")({
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
          const result = await $getPublishedChangelogs({
            data: {
              organizationSlug,
              page: 1,
              limit: 10,
            },
          });

          return new Response(JSON.stringify(result.items), {
            headers: {
              ...corsHeaders,
              "Access-Control-Allow-Origin": origin,
              "Content-Type": "application/json",
            },
          });
        } catch (e) {
          console.error("Widget Changelog API Error:", e);
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
