import { createFileRoute } from "@tanstack/react-router";
import { auth } from "~/lib/platform-auth/auth";

export const Route = createFileRoute("/api/auth/platform/$")({
  server: {
    handlers: {
      GET: ({ request }) => {
        return auth.handler(request);
      },
      POST: ({ request }) => {
        return auth.handler(request);
      },
    },
  },
});
