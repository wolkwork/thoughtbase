import { Resolver } from "dns/promises";

const dns = new Resolver();
dns.setServers(["8.8.8.8"]);

export type DomainVerificationResult = {
  cnameVerified: boolean;
  txtVerified: boolean;
  verified: boolean;
  errors: string[];
};

/**
 * Verify that a CNAME record points to the expected target
 */
async function verifyCNAME(
  domain: string,
  expectedTarget: string,
): Promise<{ verified: boolean; error?: string }> {
  try {
    const records = await dns.resolveCname(domain);
    const normalizedExpected = expectedTarget.toLowerCase().trim();
    const normalizedRecords = records.map((r) => r.toLowerCase().trim());

    // Check if any CNAME record matches the expected target
    const matches = normalizedRecords.some((record) => record === normalizedExpected);

    if (!matches) {
      return {
        verified: false,
        error: `CNAME record points to ${records[0] || "unknown"}, expected ${expectedTarget}`,
      };
    }

    return { verified: true };
  } catch (error: any) {
    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      return {
        verified: false,
        error: "CNAME record not found",
      };
    }
    return {
      verified: false,
      error: `DNS lookup failed: ${error.message}`,
    };
  }
}

/**
 * Verify that a TXT record contains the expected verification token
 */
async function verifyTXT(
  txtRecordName: string,
  expectedToken: string,
): Promise<{ verified: boolean; error?: string }> {
  try {
    const records = await dns.resolveTxt(txtRecordName);
    // DNS TXT records can be arrays of arrays of strings
    const flattenedRecords = records.flat().map((r) => r.trim());
    const normalizedExpected = expectedToken.toLowerCase().trim();

    // Check if any TXT record contains the expected token
    const matches = flattenedRecords.some((record) =>
      record.toLowerCase().includes(normalizedExpected),
    );

    if (!matches) {
      return {
        verified: false,
        error: `TXT record not found or doesn't contain the verification token`,
      };
    }

    return { verified: true };
  } catch (error: any) {
    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      return {
        verified: false,
        error: "TXT record not found",
      };
    }
    return {
      verified: false,
      error: `DNS lookup failed: ${error.message}`,
    };
  }
}

/**
 * Verify domain DNS records for custom domain setup
 * @param domain The custom domain to verify (e.g., "feedback.example.com")
 * @param orgSlug The organization slug (e.g., "acme")
 * @param verificationToken The verification token that should be in the TXT record
 * @returns Verification result with status of both CNAME and TXT records
 */
export async function verifyDomainDNS(
  domain: string,
  orgSlug: string,
  verificationToken: string,
): Promise<DomainVerificationResult> {
  const errors: string[] = [];
  const expectedCNAMETarget = `${orgSlug}.thoughtbase.app`;

  // Verify CNAME record
  const cnameResult = await verifyCNAME(domain, expectedCNAMETarget);
  if (!cnameResult.verified) {
    errors.push(cnameResult.error || "CNAME verification failed");
  }

  // Verify TXT record
  const txtRecordName = `_thoughtbase-verify.${domain}`;
  const txtResult = await verifyTXT(txtRecordName, verificationToken);
  if (!txtResult.verified) {
    errors.push(txtResult.error || "TXT verification failed");
  }

  const verified = cnameResult.verified && txtResult.verified;

  return {
    cnameVerified: cnameResult.verified,
    txtVerified: txtResult.verified,
    verified,
    errors,
  };
}
