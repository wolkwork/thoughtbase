import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { parse } from "tldts";

import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { DefaultNotFound } from "~/components/default-not-found";
import { routeTree } from "./routeTree.gen";

// Known base domains for subdomain detection
const BASE_DOMAINS = ["thoughtbase.app", "thoughtbase.localhost"] as const;

/**
 * Extract subdomain from hostname if it matches a known base domain.
 * e.g., "acme.thoughtbase.app" → "acme"
 * e.g., "acme.thoughtbase.localhost" → "acme"
 * e.g., "thoughtbase.app" → null
 * e.g., "thoughtbase.localhost" → null
 * e.g., "app.thoughtbase.app" → null (app is excluded)
 * e.g., "thoughtbase.vercel.app" → null (not a known base domain)
 */
function getSubdomain(hostname: string): string | null {
  const parsed = parse(hostname);
  const domain = parsed.domain;

  // Only process if domain matches a known base domain
  if (!domain || !BASE_DOMAINS.includes(domain as (typeof BASE_DOMAINS)[number])) {
    return null;
  }

  const subdomain = parsed.subdomain;
  // Exclude "app" from being treated as an org subdomain
  if (subdomain === "app" || !subdomain) {
    return null;
  }

  return subdomain;
}

/**
 * Get the base domain from hostname.
 * e.g., "acme.thoughtbase.app" → "thoughtbase.app"
 * e.g., "thoughtbase.app" → "thoughtbase.app"
 * e.g., "acme.thoughtbase.localhost" → "thoughtbase.localhost"
 * e.g., "thoughtbase.localhost" → "thoughtbase.localhost"
 */
function getBaseDomain(hostname: string): string {
  const parsed = parse(hostname);
  const domain = parsed.domain;

  // If domain matches a known base domain, return it
  if (domain && BASE_DOMAINS.includes(domain as (typeof BASE_DOMAINS)[number])) {
    return domain;
  }

  // Fallback: return the hostname as-is
  return hostname;
}

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 2, // 2 minutes
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient, user: null },
    defaultPreload: "intent",
    // react-query will handle data fetching & caching
    // https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#passing-all-loader-events-to-an-external-cache
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: DefaultNotFound,
    scrollRestoration: true,
    defaultStructuralSharing: true,

    rewrite: {
      input: ({ url }) => {
        // Detect subdomain for production (*.thoughtbase.app) and local (*.localhost)
        const subdomain = getSubdomain(url.hostname);

        if (subdomain) {
          url.pathname = `/org/${subdomain}${url.pathname}`;
        } else {
          // Check if this is a custom domain (not a base domain)
          const parsed = parse(url.hostname);
          const domain = parsed.domain;
          const isCustomDomain =
            !domain || !BASE_DOMAINS.includes(domain as (typeof BASE_DOMAINS)[number]);

          if (isCustomDomain) {
            // For custom domains, we need to look up the org slug from the database
            // This will be handled in the route loader, so we pass through the hostname
            // The route will need to extract the slug from the custom domain lookup
            // For now, we'll use a placeholder slug that the route loader will handle
            // The actual lookup happens in the route loader via getOrganizationBySlugOrDomain
            url.pathname = `/org/_custom${url.pathname}`;
          } else {
            // Redirect /org/slug paths to subdomain URLs (client-side only)
            const pathParts = url.pathname.split("/");
            if (pathParts[1] === "org" && pathParts[2]) {
              const orgSlug = pathParts[2];
              if (typeof window !== "undefined") {
                const baseDomain = getBaseDomain(url.hostname);
                const newUrl = new URL(url.href);
                newUrl.hostname = `${orgSlug}.${baseDomain}`;
                newUrl.pathname = url.pathname.replace(`/org/${orgSlug}`, "") || "/";
                window.location.replace(newUrl.href);
              }
            }
          }
        }

        return url;
      },
      output: ({ url }) => {
        const subdomain = getSubdomain(url.hostname);

        if (subdomain) {
          url.pathname = url.pathname.replace(`/org/${subdomain}`, "");
        } else {
          const pathParts = url.pathname.split("/");
          if (pathParts[1] === "org" && pathParts[2]) {
            const orgSlug = pathParts[2];

            // Check if this is a custom domain request
            const parsed = parse(url.hostname);
            const domain = parsed.domain;
            const isCustomDomain =
              !domain || !BASE_DOMAINS.includes(domain as (typeof BASE_DOMAINS)[number]);

            if (isCustomDomain && orgSlug === "_custom") {
              // For custom domains, keep the hostname as-is and remove the /org/_custom prefix
              url.pathname = url.pathname.replace(`/org/_custom`, "") || "/";
            } else if (!isCustomDomain) {
              // For base domains, rewrite to subdomain format
              const baseDomain = getBaseDomain(url.hostname);
              url.hostname = `${orgSlug}.${baseDomain}`;
              url.pathname = url.pathname.replace(`/org/${orgSlug}`, "") || "/";
            }
            // If it's a custom domain but slug is not _custom, leave as-is (shouldn't happen)
          }
        }

        return url;
      },
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    handleRedirects: true,
    wrapQueryClient: true,
  });

  return router;
}
