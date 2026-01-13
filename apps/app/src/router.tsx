import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { parse } from "tldts";

import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { DefaultNotFound } from "~/components/default-not-found";
import { routeTree } from "./routeTree.gen";

const BASE_DOMAIN = "thoughtbase.app";

export function rewriteInput({ url }: { url: URL }) {
  if (url.hostname.includes("localhost")) {
    const parsed = parse(url.hostname);
    const subdomain = parsed.subdomain;

    if (subdomain && parsed.domain) {
      url.hostname = parsed.domain;
      url.pathname = `/subdomain/${subdomain}${url.pathname}`;
    }

    return url;
  }

  if (url.hostname.includes(BASE_DOMAIN)) {
    const parsed = parse(url.hostname);
    const subdomain = parsed.subdomain;

    if (subdomain && parsed.domain && subdomain !== "app") {
      url.hostname = parsed.domain;
      url.pathname = `/subdomain/${subdomain}${url.pathname}`;
    }

    return url;
  }

  if (url.hostname.includes("vercel.app")) {
    return url;
  }

  const parsed = parse(url.hostname);
  const domain = parsed.domain;
  if (domain) {
    url.hostname = domain;
    url.pathname = `/subdomain/_custom${url.pathname}`;
  }

  return url;
}

export function rewriteOutput({ url }: { url: URL }) {
  if (url.hostname.includes("localhost")) {
    const parsed = parse(url.hostname);
    const subdomain = parsed.subdomain;

    if (subdomain) {
      url.pathname = url.pathname.replace(`/subdomain/${subdomain}`, "");
    }

    return url;
  }

  if (url.hostname.includes(BASE_DOMAIN)) {
    const parsed = parse(url.hostname);
    const subdomain = parsed.subdomain;

    if (subdomain && subdomain !== "app") {
      url.pathname = url.pathname.replace(`/subdomain/${subdomain}`, "");
    }

    return url;
  }

  if (url.hostname.includes("vercel.app")) {
    return url;
  }

  const parsed = parse(url.hostname);
  const domain = parsed.domain;
  if (domain) {
    url.pathname = url.pathname.replace(`/subdomain/_custom`, "");
  }

  return url;
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
      input: rewriteInput,
      output: rewriteOutput,
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
