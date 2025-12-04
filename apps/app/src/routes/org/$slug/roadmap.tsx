import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { PublicHeader } from "~/components/public-header";
import { RoadmapBoard } from "~/components/roadmap-board";
import { $getIdeas } from "~/lib/api/ideas";

export const Route = createFileRoute("/org/$slug/roadmap")({
  component: PublicRoadmapPage,
});

function PublicRoadmapPage() {
  const { org, user } = useLoaderData({ from: "/org/$slug" });

  const { data: ideas } = useQuery({
    queryKey: ["public-ideas", org.id],
    queryFn: () => $getIdeas({ data: { organizationId: org.id } }),
  });

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <PublicHeader org={org} user={user} />

      <div className="container mx-auto flex flex-1 flex-col overflow-hidden px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Roadmap</h1>
          <p className="text-muted-foreground">See what we are working on.</p>
        </div>

        <div className="min-h-0 flex-1 overflow-x-auto">
          <RoadmapBoard ideas={ideas || []} readOnly publicOrgSlug={org.slug} />
        </div>
      </div>
    </div>
  );
}
