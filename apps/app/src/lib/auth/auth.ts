import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import * as schema from "~/lib/db/schema";

import { env } from "~/env/server";
import { db } from "~/lib/db";

import { checkout, polar, portal, usage } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { apiKey, organization } from "better-auth/plugins";

const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

const getAuthConfig = createServerOnlyFn(() =>
  betterAuth({
    baseURL: env.VITE_BASE_URL,
    telemetry: {
      enabled: false,
    },
    trustedOrigins: ["*.thoughtbase.localhost:3000", "http://localhost:4321"],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        organization: schema.organization,
        member: schema.member,
        invitation: schema.invitation,
        apikey: schema.apikey,
      },
    }),
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: new URL(env.VITE_BASE_URL).hostname,
      },
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        // TODO: Fix
        domain: ".thoughtbase.localhost",
      },
      trustedOrigins: ["*.thoughtbase.localhost:3000", "http://localhost:4321"], // Add demo app origin
    },

    // https://www.better-auth.com/docs/integrations/tanstack#usage-tips
    plugins: [
      tanstackStartCookies(),
      organization(),
      apiKey(),
      polar({
        client: polarClient,
        createCustomerOnSignUp: true,
        use: [
          checkout({
            products: [
              {
                productId: env.POLAR_STARTER_ID,
                slug: "starter",
              },
              {
                productId: env.POLAR_GROWTH_ID,
                slug: "growth",
              },
            ],
            authenticatedUsersOnly: true,
          }),
          portal(),
          usage(),
        ],
      }),
    ],

    // https://www.better-auth.com/docs/concepts/session-management#session-caching
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },

    // https://www.better-auth.com/docs/concepts/oauth
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID!,
        clientSecret: env.GITHUB_CLIENT_SECRET!,
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
      },
    },

    // https://www.better-auth.com/docs/authentication/email-password
    emailAndPassword: {
      enabled: true,
    },
  }),
);

export const auth = getAuthConfig();
