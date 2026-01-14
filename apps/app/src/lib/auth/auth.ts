import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import * as schema from "~/lib/db/schema";

import { env } from "~/env/server";
import { db } from "~/lib/db";
import { sendEmail } from "~/lib/email";

import { checkout, polar, portal, usage } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { apiKey, openAPI, organization } from "better-auth/plugins";
import { getBaseUrl } from "../base-url";

const getPolarClient = createServerOnlyFn(() => {
  return new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: env.VERCEL_ENV === "production" ? "production" : "sandbox",
  });
});

export const polarClient = getPolarClient();

const getAuthConfig = createServerOnlyFn(() => {
  return betterAuth({
    telemetry: {
      enabled: false,
    },
    // Note: Custom domains are handled dynamically in /api/auth/$ route CORS
    // Better Auth's trustedOrigins is static, so we can't add custom domains here
    // The auth API route checks verified custom domains separately
    trustedOrigins: [getBaseUrl(), "http://*.thoughtbase.localhost:3000"],
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
      // Enable cross-subdomain cookies for *.thoughtbase.app subdomains
      // Custom domains will have their own cookies (domain: undefined handles this)
      crossSubDomainCookies: {
        enabled: true,
        domain: new URL(getBaseUrl()).hostname,
      },
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: true,
        // domain: undefined means cookies are set for the exact domain making the request
        // This allows each domain (main, subdomain, custom) to have its own cookies
        // while sharing the same session data in the database
        domain: undefined,
      },
    },

    // https://www.better-auth.com/docs/integrations/tanstack#usage-tips
    plugins: [
      tanstackStartCookies(),
      openAPI(),
      organization({
        // https://www.better-auth.com/docs/plugins/organization#setup-invitation-email
        async sendInvitationEmail(data) {
          const inviteLink = `${getBaseUrl()}/accept-invitation/${data.id}`;
          void sendEmail({
            to: data.email,
            subject: `You've been invited to join ${data.organization.name}`,
            html: `
              <h1>You've been invited!</h1>
              <p>Hi there,</p>
              <p><strong>${data.inviter.user.name || data.inviter.user.email}</strong> has invited you to join <strong>${data.organization.name}</strong> on Thoughtbase.</p>
              <p>Click the link below to accept the invitation:</p>
              <p><a href="${inviteLink}">Accept Invitation</a></p>
              <p>Or copy and paste this URL into your browser:</p>
              <p>${inviteLink}</p>
              <p>This invitation will expire in 48 hours.</p>
            `,
          });
        },
      }),
      apiKey(),
      polar({
        client: polarClient,
        createCustomerOnSignUp: env.VERCEL_ENV === "production" ? true : false,
        use: [
          checkout({
            products: [
              {
                productId: env.POLAR_START_ID,
                slug: "start",
              },
              {
                productId: env.POLAR_PRO_ID,
                slug: "pro",
              },
              {
                productId: env.POLAR_BUSINESS_ID,
                slug: "business",
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
      sendResetPassword: async ({ user, url }) => {
        void sendEmail({
          to: user.email,
          subject: "Reset your password",
          html: `
            <h1>Reset your password</h1>
            <p>Hi ${user.name || "there"},</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${url}">Reset Password</a></p>
            <p>Or copy and paste this URL into your browser:</p>
            <p>${url}</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          `,
        });
      },
    },

    // https://www.better-auth.com/docs/concepts/email
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        void sendEmail({
          to: user.email,
          subject: "Verify your email address",
          html: `
            <h1>Verify your email</h1>
            <p>Hi ${user.name || "there"},</p>
            <p>Please click the link below to verify your email address:</p>
            <p><a href="${url}">Verify Email</a></p>
            <p>Or copy and paste this URL into your browser:</p>
            <p>${url}</p>
            <p>This link will expire in 1 hour.</p>
          `,
        });
      },
    },
  });
});

export const auth = getAuthConfig();
