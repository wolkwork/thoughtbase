import { createFileRoute } from "@tanstack/react-router";
import { auth } from "~/lib/auth/auth";

// TODO: Make production ready. Include custom domains
const allowedOriginRegexes = [
  /^http:\/\/(?:[^.]+\.)?thoughtbase\.localhost:3000$/,
  /^http:\/\/(?:[^.]+\.)?thoughtbase\.app$/,
  /^https:\/\/(?:[^.]+\.)?vercel\.app$/,
];

function isAllowedOrigin(origin: string) {
  return allowedOriginRegexes.some((regex) => regex.test(origin));
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin");

        if (origin && isAllowedOrigin(origin)) {
          return new Response(null, {
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": origin,
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Cookie, Authorization",
              "Access-Control-Allow-Credentials": "true",
            },
          });
        }

        return new Response(null, {
          status: 403,
        });
      },
      GET: async ({ request }) => {
        const origin = request.headers.get("origin");

        const response = await auth.handler(request);

        if (origin && isAllowedOrigin(origin)) {
          response.headers.set("Access-Control-Allow-Origin", origin);
        }
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.headers.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Cookie, Authorization",
        );
        response.headers.set("Access-Control-Allow-Credentials", "true");
        return response;
      },
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");

        const response = await auth.handler(request);
        if (origin && isAllowedOrigin(origin)) {
          response.headers.set("Access-Control-Allow-Origin", origin);
        }
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.headers.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Cookie, Authorization",
        );
        response.headers.set("Access-Control-Allow-Credentials", "true");
        return response;
      },
    },
  },
});
