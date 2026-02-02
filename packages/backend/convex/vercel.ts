"use node";

import { Vercel } from "@vercel/sdk";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, components } from "./_generated/api";

function getVercelClient() {
  if (!process.env.VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN environment variable is not set");
  }
  return new Vercel({
    bearerToken: process.env.VERCEL_TOKEN,
  });
}

// Export DNSRecord type for use in frontend
export type DNSRecord = {
  type: "CNAME" | "A" | "TXT";
  name: string;
  value: string;
};

/**
 * Add a domain to Vercel project
 */
export const addDomainToVercel = action({
  args: {
    domain: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID) {
      throw new Error("Vercel configuration missing");
    }

    const vercel = getVercelClient();
    return await vercel.projects.addProjectDomain({
      idOrName: process.env.VERCEL_PROJECT_ID,
      requestBody: {
        name: args.domain,
        redirect: null,
        gitBranch: null,
      },
    });
  },
});

/**
 * Get domain status from Vercel and return DNS records that need to be set
 */
export const refreshDomainStatusFromVercel = action({
  args: {
    domain: v.string(),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID) {
      throw new Error("Vercel configuration missing");
    }

    const vercel = getVercelClient();
    const [domainResponse, configResponse] = await Promise.all([
      vercel.projects.getProjectDomain({
        idOrName: process.env.VERCEL_PROJECT_ID,
        domain: args.domain,
      }),
      vercel.domains.getDomainConfig({
        domain: args.domain,
      }),
    ]);

    const dnsRecordsToSet: DNSRecord[] = [];

    if (domainResponse.name !== domainResponse.apexName) {
      dnsRecordsToSet.push({
        type: "CNAME",
        name: domainResponse.name.replace(`.${domainResponse.apexName}`, ""),
        value: configResponse.recommendedCNAME[0].value,
      });
    } else {
      dnsRecordsToSet.push({
        type: "A",
        name: "@",
        value: configResponse.recommendedIPv4[0].value[0],
      });
    }

    if (domainResponse.verification) {
      dnsRecordsToSet.push({
        type: "TXT",
        name: domainResponse.verification[0].domain.replace(
          `.${domainResponse.apexName}`,
          "",
        ),
        value: domainResponse.verification[0].value,
      });
    }

    const result = {
      domain: args.domain,
      status: configResponse.misconfigured
        ? ("invalid" as const)
        : domainResponse.verification
          ? ("pending" as const)
          : domainResponse.verified
            ? ("verified" as const)
            : ("pending" as const),
      dnsRecordsToSet,
    };

    if (args.organizationId) {
      await ctx.scheduler.runAfter(
        0,
        components.betterAuth.functions.updateOrganizationDomainStatus,
        {
          id: args.organizationId,
          domainVerificationStatus: result.status,
          dnsRecordsToSet,
        },
      );
    }
  },
});

/**
 * Remove a domain from Vercel
 * Reference: https://platforms.guide/platforms/docs/multi-tenant-platforms/reference#remove-domain
 */
export const removeDomainFromVercel = action({
  args: {
    domain: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!process.env.VERCEL_TOKEN) {
      throw new Error("Vercel configuration missing");
    }

    const vercel = getVercelClient();
    await vercel.domains.deleteDomain({
      domain: args.domain,
      teamId: process.env.VERCEL_TEAM_ID || undefined,
    });

    return null;
  },
});
