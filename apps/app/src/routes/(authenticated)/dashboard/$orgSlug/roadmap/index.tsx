import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
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

    return { ideas };
  },
  component: RoadmapPage,
});

function RoadmapPage() {
  const { ideas: initialIdeas } = Route.useLoaderData();
  const { organization } = useRouteContext({
    from: "/(authenticated)/dashboard/$orgSlug",
  });

  const { data: ideas } = useQuery({
    queryKey: ["ideas", "all", organization.id],
    queryFn: () => $getIdeas({ data: { organizationId: organization.id } }),
    initialData: initialIdeas,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-6 flex shrink-0 items-center justify-between">
        <h1 className="text-2xl font-bold">Roadmap</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto">
        <RoadmapBoard
          ideas={ideas}
          organizationId={organization.id}
          orgSlug={organization.slug}
        />
      </div>
    </div>
  );
}
