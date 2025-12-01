import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import * as schema from "~/lib/db/schema";

import { env } from "~/env/server";
import { db } from "~/lib/db";

import { apiKey, organization } from "better-auth/plugins";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk"


const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
})

const getAuthConfig = createServerOnlyFn(() =>
  betterAuth({
    baseURL: env.VITE_BASE_URL,
    telemetry: {
      enabled: false,
    },
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
      }
    }),

    // https://www.better-auth.com/docs/integrations/tanstack#usage-tips
    plugins: [tanstackStartCookies(), organization(), apiKey(), polar({ 
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: env.POLAR_STARTER_ID,
              slug: "starter"
            },
            {
              productId: env.POLAR_GROWTH_ID,
              slug: "growth"
            },
          ],
          successUrl: `${env.VITE_BASE_URL}/dashboard/settings?success=true`,
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
      ],
    })],

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
