import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MembersDataTable } from "~/components/members-data-table";
import { $getMembers } from "~/lib/api/members";
import { $getOrganizationBySlug } from "~/lib/api/organizations";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/members/")({
  loader: async ({ params }) => {
    const organization = await $getOrganizationBySlug({ data: params.orgSlug });
    if (!organization) {
      throw new Error("Organization not found");
    }

    const members = await $getMembers({
      data: { organizationId: organization.id },
    });
    return { members, organizationId: organization.id };
  },
  component: MembersPage,
});

function MembersPage() {
  const { members: initialMembers, organizationId } = Route.useLoaderData();

  const { data: members } = useQuery({
    queryKey: ["workspace-users", organizationId],
    queryFn: () =>
      $getMembers({
        data: { organizationId },
      }),
    initialData: initialMembers,
  });

  // Map the data to ensure dates are Date objects if they were serialized
  const tableData = members.map((member) => ({
    ...member,
    createdAt: new Date(member.createdAt),
    lastActiveAt: member.lastActiveAt ? new Date(member.lastActiveAt) : null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-col justify-between">
        <h1 className="text-2xl font-bold">Contributors</h1>
        <p className="text-muted-foreground text-sm">
          People that have participated in your workspace.
        </p>
      </div>

      <div className="">
        <MembersDataTable data={tableData} />
      </div>
    </div>
  );
}
