import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RoadmapBoard } from "~/components/roadmap-board";
import { $getIdeas } from "~/lib/api/ideas";
import { $getOrganizationBySlug } from "~/lib/api/organizations";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/roadmap/")({
  loader: async ({ params }) => {
    const organization = await $getOrganizationBySlug({ data: params.orgSlug });
    if (!organization) {
      throw new Error("Organization not found");
    }

    const ideas = await $getIdeas({
      data: { organizationId: organization.id },
    });
    return { ideas, organizationId: organization.id };
  },
  component: RoadmapPage,
});

function RoadmapPage() {
  const { ideas: initialIdeas, organizationId } = Route.useLoaderData();

  const { data: ideas } = useQuery({
    queryKey: ["ideas", "all", organizationId],
    queryFn: () => $getIdeas({ data: { organizationId } }),
    initialData: initialIdeas,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-6 flex flex-shrink-0 items-center justify-between">
        <h1 className="text-2xl font-bold">Roadmap</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto">
        <RoadmapBoard ideas={ideas} organizationId={organizationId} />
      </div>
    </div>
  );
}
