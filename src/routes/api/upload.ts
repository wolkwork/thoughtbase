import { createFileRoute } from "@tanstack/react-router";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "~/lib/auth/auth";

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as HandleUploadBody;

        try {
          const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => {
              const session = await auth.api.getSession({
                headers: request.headers,
              });

              if (!session) {
                throw new Error("Unauthorized");
              }

              return {
                allowedContentTypes: [
                  "image/jpeg",
                  "image/png",
                  "image/gif",
                  "image/webp",
                ],
                addRandomSuffix: true,
                tokenPayload: JSON.stringify({
                  userId: session.user.id,
                  orgId: session.session.activeOrganizationId,
                }),
              };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
              console.log("blob upload completed", blob, tokenPayload);
            },
          });

          return new Response(JSON.stringify(jsonResponse), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
