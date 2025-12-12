import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { DefaultNotFound } from "~/components/default-not-found";
import { routeTree } from "./routeTree.gen";

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
        const parts = url.hostname.split(".");
        if (parts.length > 2) {
          const subdomain = parts[0];

          url.pathname = `/org/${subdomain}${url.pathname}`;
        } else {
          // TODO: Idk if this redirect is correct
          const pathParts = url.pathname.split("/");
          if (pathParts[1] === "org" && pathParts[2]) {
            const subdomain = pathParts[2];
            if (typeof window !== "undefined") {
              const newUrl = new URL(url.href);
              newUrl.hostname = `${subdomain}.${url.hostname}`;
              newUrl.pathname = url.pathname.replace(`/org/${subdomain}`, "") || "/";
              window.location.replace(newUrl.href);
            }
          }
        }

        return url;
      },
      output: ({ url }) => {
        const parts = url.hostname.split(".");
        if (parts.length > 2) {
          const subdomain = parts[0];

          url.pathname = url.pathname.replace(`/org/${subdomain}`, "");
        } else {
          const pathParts = url.pathname.split("/");
          if (pathParts[1] === "org" && pathParts[2]) {
            const subdomain = pathParts[2];
            url.hostname = `${subdomain}.${url.hostname}`;
            url.pathname = url.pathname.replace(`/org/${subdomain}`, "") || "/";
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
