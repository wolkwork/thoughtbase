// TODO: It might be possible to simplify this a lot

import { createFileRoute } from "@tanstack/react-router";
import { $isVerifiedCustomDomain } from "~/lib/api/organizations";
import { auth } from "~/lib/auth/auth";

const allowedOriginRegexes = [
  /^http:\/\/(?:[^.]+\.)?thoughtbase\.localhost:3000$/,
  /^https:\/\/(?:[^.]+\.)?thoughtbase\.app$/,
  /^https:\/\/(?:[^.]+\.)?vercel\.app$/,
];

async function isAllowedOrigin(origin: string): Promise<boolean> {
  // Check against base domain patterns
  if (allowedOriginRegexes.some((regex) => regex.test(origin))) {
    return true;
  }

  // Check if it's a verified custom domain
  return await $isVerifiedCustomDomain({ data: origin });
}

/**
 * Modify Set-Cookie headers to use the correct domain based on the request origin.
 * For verified custom domains, sets the cookie domain to the custom domain.
 * For base domains, keeps the existing domain (Better Auth handles these correctly).
 */
async function modifyCookieDomain(
  setCookieHeaders: string[],
  origin: string | null,
): Promise<string[]> {
  if (!origin) {
    return setCookieHeaders;
  }

  try {
    const originUrl = new URL(origin);
    const originHostname = originUrl.hostname;

    // Check if this is a base domain (not a custom domain)
    const isBaseDomain = allowedOriginRegexes.some((regex) => regex.test(origin));

    if (isBaseDomain) {
      // For base domains, return as-is (Better Auth handles these correctly)
      return setCookieHeaders;
    }

    // For custom domains (which are already verified via isAllowedOrigin),
    // modify the cookie domain to match the custom domain
    return setCookieHeaders.map((cookieHeader) => {
      // Remove existing Domain attribute if present
      let modifiedCookie = cookieHeader.replace(/;\s*Domain=[^;]+/gi, "");

      // Add the custom domain
      // Note: We don't add a leading dot for custom domains as they're typically
      // single domains, not subdomain wildcards
      modifiedCookie += `; Domain=${originHostname}`;

      return modifiedCookie;
    });
  } catch {
    // If origin parsing fails, return original headers
    return setCookieHeaders;
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin");

        if (origin && (await isAllowedOrigin(origin))) {
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

        if (origin && (await isAllowedOrigin(origin))) {
          response.headers.set("Access-Control-Allow-Origin", origin);

          // Modify Set-Cookie headers for custom domains
          const setCookieHeaders = response.headers.getSetCookie();
          if (setCookieHeaders.length > 0) {
            // Remove existing Set-Cookie headers
            response.headers.delete("Set-Cookie");
            // Add modified Set-Cookie headers with correct domain
            const modifiedCookies = await modifyCookieDomain(setCookieHeaders, origin);
            modifiedCookies.forEach((cookie) => {
              response.headers.append("Set-Cookie", cookie);
            });
          }
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
        if (origin && (await isAllowedOrigin(origin))) {
          response.headers.set("Access-Control-Allow-Origin", origin);

          // Modify Set-Cookie headers for custom domains
          const setCookieHeaders = response.headers.getSetCookie();
          if (setCookieHeaders.length > 0) {
            // Remove existing Set-Cookie headers
            response.headers.delete("Set-Cookie");
            // Add modified Set-Cookie headers with correct domain
            const modifiedCookies = await modifyCookieDomain(setCookieHeaders, origin);
            modifiedCookies.forEach((cookie) => {
              response.headers.append("Set-Cookie", cookie);
            });
          }
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
