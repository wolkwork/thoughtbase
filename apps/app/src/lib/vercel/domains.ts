import { Vercel } from "@vercel/sdk";
import { env } from "~/env/server";

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

  console.log(
    "CONFIG RESPONSE",
    JSON.stringify({ domainResponse, configResponse }, null, 2),
  );

  // const dnsRecordsToSet = {
  //   verification: domainResponse.verification,
  //   cname: {
  //     name: domainResponse.name === domainResponse.apexName
  //       ? undefined
  //       : configResponse.recommendedCNAME[0].name,
  //     value: domainResponse.name === domainResponse.apexName
  //       ? undefined
  //       : configResponse.recommendedCNAME[0].value,
  //   },
  //   a:
  //     domainResponse.name === domainResponse.apexName
  //       ? configResponse.recommendedIPv4[0]
  //       : undefined,
  // };

  const dnsRecordsToSet: DNSRecord[] = [];

  if (domainResponse.name !== domainResponse.apexName) {
    dnsRecordsToSet.push({
      type: "CNAME",
      name: domainResponse.name.replace(domainResponse.apexName, ""),
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
      name: domainResponse.verification[0].domain.replace(`.${domain}`, ""),
      value: domainResponse.verification[0].value,
    });
  }

  return {
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
}

/**
 * Get domain configuration including DNS records and verification status
 * Reference: https://platforms.guide/platforms/docs/multi-tenant-platforms/reference#verify-domain
 */
export async function getDomainConfigFromVercel(domain: string) {
  try {
    const result = await vercel.domains.getDomainConfig({
      domain,
      ...(env.VERCEL_TEAM_ID && { teamId: env.VERCEL_TEAM_ID }),
      ...(env.VERCEL_TEAM_SLUG && { slug: env.VERCEL_TEAM_SLUG }),
    });

    // Build verification instructions from DNS records
    const verification = [];

    // Add CNAME recommendations
    if (result.recommendedCNAME && result.recommendedCNAME.length > 0) {
      const cname = result.recommendedCNAME[0]; // Use rank 1 (preferred)
      verification.push({
        type: "CNAME",
        domain: domain,
        value: cname.value,
        reason: `Add a CNAME record pointing ${domain} to ${cname.value}`,
      });
    }

    // Add A record recommendations
    if (result.recommendedIPv4 && result.recommendedIPv4.length > 0) {
      const ipv4 = result.recommendedIPv4[0]; // Use rank 1 (preferred)
      verification.push({
        type: "A",
        domain: domain,
        value: ipv4.value.join(", "),
        reason: `Add A records pointing ${domain} to ${ipv4.value.join(", ")}`,
      });
    }

    // Domain is verified if it's not misconfigured and has a configuredBy value
    const verified = !result.misconfigured && result.configuredBy !== null;

    return {
      verified,
      verification: verification.length > 0 ? verification : undefined,
      recommendedCNAME: result.recommendedCNAME,
      recommendedIPv4: result.recommendedIPv4,
      configuredBy: result.configuredBy,
      misconfigured: result.misconfigured,
    };
  } catch (error: unknown) {
    // Domain not found
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Verify domain ownership with Vercel
 * Uses getDomainConfig which returns verification status and DNS records
 */
export async function verifyDomainWithVercel(
  domain: string,
): Promise<{ verified: boolean; verification?: VercelDomainStatus["verification"] }> {
  const config = await getDomainConfigFromVercel(domain);
  if (!config) {
    return {
      verified: false,
      verification: [
        {
          type: "error",
          domain,
          value: "",
          reason: "Domain not found",
        },
      ],
    };
  }

  return {
    verified: config.verified,
    verification: config.verification,
  };
}

/**
 * Remove a domain from Vercel
 * Reference: https://platforms.guide/platforms/docs/multi-tenant-platforms/reference#remove-domain
 */
export async function removeDomainFromVercel(domain: string): Promise<void> {
  await vercel.domains.deleteDomain({
    domain,
    ...(env.VERCEL_TEAM_ID && { teamId: env.VERCEL_TEAM_ID }),
    ...(env.VERCEL_TEAM_SLUG && { slug: env.VERCEL_TEAM_SLUG }),
  });
}
