import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { RoadmapBoard } from "~/components/roadmap-board";
import { $getPublicRoadmapIdeas } from "~/lib/api/ideas";

export const Route = createFileRoute("/org/$slug/roadmap")({
  component: PublicRoadmapPage,
});

function PublicRoadmapPage() {
  const { org } = useLoaderData({ from: "/org/$slug" });

  const { data: ideas } = useQuery({
    queryKey: ["public-roadmap-ideas", org.id],
    queryFn: () => $getPublicRoadmapIdeas({ data: { organizationId: org.id } }),
  });

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
          <RoadmapBoard ideas={ideas || []} readOnly publicOrgSlug={org.slug} public />
        </div>
      </div>
    </div>
  );
}
