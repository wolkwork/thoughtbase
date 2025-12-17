import { createFileRoute } from "@tanstack/react-router";
import { $createIdea, $getIdeas } from "~/lib/api/ideas";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cookie",
  "Access-Control-Allow-Credentials": "true",
};

export const Route = createFileRoute("/api/widget/ideas")({
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
        const organizationId = url.searchParams.get("organizationId");

        if (!organizationId) {
          return new Response("Missing organizationId", {
            status: 400,
            headers: {
              ...corsHeaders,
              "Access-Control-Allow-Origin": origin,
            },
          });
        }

        try {
          // $getIdeas uses getRequest() internally to check auth/headers
          // This should work if the headers are passed through or available in context
          const ideas = await $getIdeas({ data: { organizationId } });
          return new Response(JSON.stringify(ideas), {
            headers: {
              ...corsHeaders,
              "Access-Control-Allow-Origin": origin,
              "Content-Type": "application/json",
            },
          });
        } catch (e) {
          console.error("Widget API Error:", e);
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
      POST: async ({ request }) => {
        const origin = request.headers.get("origin") || "*";
        try {
          const body = await request.json();
          const result = await $createIdea({ data: body });
          return new Response(JSON.stringify(result), {
            headers: {
              ...corsHeaders,
              "Access-Control-Allow-Origin": origin,
              "Content-Type": "application/json",
            },
          });
        } catch (e) {
          console.error("Widget API POST Error:", e);
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
