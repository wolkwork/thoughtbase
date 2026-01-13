import { Vercel } from "@vercel/sdk";
import { eq } from "drizzle-orm";
import { env } from "~/env/server";
import { db } from "../db";
import { organization } from "../db/schema";

const vercel = new Vercel({
  bearerToken: env.VERCEL_TOKEN,
});

export async function addDomainToVercel(domain: string) {
  return vercel.projects.addProjectDomain({
    idOrName: env.VERCEL_PROJECT_ID,
    requestBody: {
      name: domain,
      redirect: null,
      gitBranch: null,
    },
  });
}

export interface DNSRecord {
  type: "CNAME" | "A" | "TXT";
  name: string;
  value: string;
}

export async function getDomainStatusFromVercel(domain: string) {
  const [domainResponse, configResponse] = await Promise.all([
    vercel.projects.getProjectDomain({
      idOrName: env.VERCEL_PROJECT_ID,
      domain,
    }),
    vercel.domains.getDomainConfig({
      domain,
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
    domain,
    status: configResponse.misconfigured
      ? ("invalid" as const)
      : domainResponse.verification
        ? ("pending" as const)
        : domainResponse.verified
          ? ("verified" as const)
          : ("pending" as const),
    dnsRecordsToSet,
  };

  // Save verification info in the database
  if (domainResponse.verification) {
    // Import and use db/organization model
    // (Assuming db and organization are already imported in this file's context)
    await db
      .update(organization)
      .set({
        domainVerificationStatus: result.status,
        domainVerifiedAt: new Date(),
      })
      .where(eq(organization.customDomain, domain));
  }

  return result;
}

/**
 * Remove a domain from Vercel
 * Reference: https://platforms.guide/platforms/docs/multi-tenant-platforms/reference#remove-domain
 */
export async function removeDomainFromVercel(domain: string): Promise<void> {
  await vercel.domains.deleteDomain({
    domain,
    teamId: env.VERCEL_TEAM_ID,
  });
}
