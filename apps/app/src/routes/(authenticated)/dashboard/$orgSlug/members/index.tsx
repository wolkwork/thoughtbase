import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { MembersDataTable } from "~/components/members-data-table";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/members/")({
  loader: async ({ context }) => {
    // Use organization from parent route context
    const members = await context.queryClient.ensureQueryData(
      convexQuery(api.members.getMembers, {
        organizationId: context.organization._id,
      }),
    );
    return { members, organizationId: context.organization._id };
  },
  component: MembersPage,
});

function MembersPage() {
  const { members: initialMembers, organizationId } = Route.useLoaderData();

  const { data: members } = useSuspenseQuery(
    convexQuery(api.members.getMembers, {
      organizationId,
    }),
  );

  // Map the data to ensure dates are Date objects (Convex returns timestamps as numbers)
  const tableData = (members || initialMembers || []).map((member) => ({
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
