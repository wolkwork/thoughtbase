import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { RoadmapBoard } from "~/components/roadmap-board";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/roadmap/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.ideas.getIdeas, {
        organizationId: context.organization._id,
      }),
    );
  },
  component: RoadmapPage,
});

function RoadmapPage() {
  const { organization } = useRouteContext({
    from: "/(authenticated)/dashboard/$orgSlug",
  });

  const { data: ideas } = useSuspenseQuery(
    convexQuery(api.ideas.getIdeas, {
      organizationId: organization._id,
    }),
  );

  // Transform ideas data to match expected format

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mb-6 flex shrink-0 items-center justify-between">
        <h1 className="text-2xl font-bold">Roadmap</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto">
        <RoadmapBoard
          ideas={ideas}
          organizationId={organization._id}
          orgSlug={organization.slug}
        />
      </div>
    </div>
  );
}
