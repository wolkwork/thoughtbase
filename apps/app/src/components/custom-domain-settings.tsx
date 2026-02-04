import { CustomDomain } from "~/components/custom-domain";
import { useOrganization } from "~/hooks/organization";

export function CustomDomainSettings() {
  const organization = useOrganization();

  return (
    <CustomDomain
      defaultDomain={organization?.customDomain || undefined}
      organizationId={organization?._id}
    />
  );
}
