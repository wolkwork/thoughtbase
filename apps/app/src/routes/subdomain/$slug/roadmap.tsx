import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { RoadmapBoard } from "~/components/roadmap-board";

export const Route = createFileRoute("/subdomain/$slug/roadmap")({
  component: PublicRoadmapPage,
});

function PublicRoadmapPage() {
  const { org } = useLoaderData({ from: "/subdomain/$slug" });

  const { data: ideas } = useQuery(
    convexQuery(api.ideas.getIdeasPublic, {
      organizationId: org._id,
      paginationOpts: {
        numItems: 1000,
        cursor: null,
      },
    }),
  );

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Header stays aligned with max-w-6xl containers */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-6">
        <h1 className="text-2xl font-bold">Roadmap</h1>
        <p className="text-muted-foreground">See what we are working on.</p>
      </div>

      {/* Full-width scrollable container - roadmap can scroll over left padding */}
      <div className="min-h-0 flex-1 overflow-x-auto pr-8 pb-8">
        <div className="inline-flex min-w-full pl-[max(1rem,calc((100vw-72rem)/2+1rem))]">
          <RoadmapBoard
            ideas={ideas?.page || []}
            readOnly
            orgSlug={org.slug}
            isPublic
            organizationId={org._id}
          />
        </div>
      </div>
    </div>
  );
}
